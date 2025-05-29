import {
	call,
	estimateGas,
	getBytecode,
	getChains,
	sendTransaction,
	simulateContract,
	switchChain,
	waitForTransactionReceipt
} from '@wagmi/core';
import Image from 'next/image';
import Link from 'next/link';
import {usePlausible} from 'next-plausible';
import {useCallback, useEffect, useState} from 'react';
import {toast} from 'react-hot-toast';
import {encodeFunctionData, parseEther} from 'viem';
import {useAccount, useChainId, useConfig} from 'wagmi';

import {Button} from '@lib/components/Button';
import {IconLinkOut} from '@lib/components/icons/IconLinkOut';
import {DISPERSE_ABI} from '@lib/utils/abi/disperse.abi';
import {GNOSIS_SAFE_PROXY_FACTORY} from '@lib/utils/abi/gnosisSafeProxyFactory.abi';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {toAddress, truncateHex} from '@lib/utils/tools.addresses';
import {CHAINS} from '@lib/utils/tools.chains';
import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {multicall} from 'app/(apps)/multisafe/actions';
import {
	DEFAULT_FEES_USD,
	SINGLETON_L1,
	SINGLETON_L2
} from 'app/(apps)/multisafe/constants';
import {useMultisafe} from 'app/(apps)/multisafe/contexts/useMultisafe';
import {generateArgInitializers, getFallbackHandler, getProxyFromSingleton} from 'app/(apps)/multisafe/utils';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {GetTransactionReturnType} from '@wagmi/core';
import type {ReactElement} from 'react';
import type {Chain} from 'viem';

type TChainStatusArgs = {
	chain: Chain;
	safeAddress: TAddress;
	originalTx?: GetTransactionReturnType;
	owners: TAddress[];
	threshold: number;
	salt: bigint;
	singleton?: TAddress;
	paymentReceiver?: TAddress;
};

function ChainStatus({
	chain,
	safeAddress,
	originalTx,
	owners,
	threshold,
	salt,
	singleton,
	paymentReceiver
}: TChainStatusArgs): ReactElement {
	const config = useConfig();
	const plausible = usePlausible();
	const {chainCoinPrices} = useMultisafe();
	const gasCoinID = CHAINS?.[chain.id]?.coingeckoGasCoinID || 'ethereum';
	const coinPrice = chainCoinPrices?.[gasCoinID]?.usd;
	const chainID = useChainId();
	const currentChain = CHAINS[chain.id];
	const {address, connector} = useAccount();
	const [isDeployedOnThatChain, setIsDeployedOnThatChain] = useState(false);
	const [cloneStatus, setCloneStatus] = useState(defaultTxStatus);
	const [canDeployOnThatChain, setCanDeployOnThatChain] = useState({
		canDeploy: true,
		isLoading: true,
		method: 'contract'
	});

	/******************************************************************************************
	 ** If the safe is already deployed on that chain, we don't need to do anything.
	 ******************************************************************************************/
	const checkIfDeployedOnThatChain = useCallback(async (): Promise<void> => {
		const byteCode = await getBytecode(config, {address: safeAddress, chainId: chain.id});
		if (byteCode) {
			setIsDeployedOnThatChain(true);
		} else {
			setIsDeployedOnThatChain(false);
		}
	}, [chain.id, safeAddress, config]);

	/******************************************************************************************
	 ** As we want to be sure to deploy the safe on the same address as the original transaction,
	 ** we need to check if the address we expect is the same as the one we get from the proxy
	 ** factory.
	 ** We do this by simulating the creation of a new safe with the same arguments as the
	 ** original transaction.
	 ******************************************************************************************/
	const checkDeploymentExpectedAddress = useCallback(async (): Promise<void> => {
		if (owners.length === 0) {
			return;
		}
		let prepareWriteAddress = toAddress();
		let prepareCallAddress = toAddress();

		const signletonToUse = singleton || SINGLETON_L2;
		if (signletonToUse === SINGLETON_L1) {
			return setCanDeployOnThatChain({canDeploy: false, isLoading: false, method: 'none'});
		}

		/**************************************************************************************
		** First try to clone with the regular FALLBACK_HANDLER
		**************************************************************************************/
		const argInitializers = generateArgInitializers(
			owners,
			threshold,
			toAddress(paymentReceiver),
			getFallbackHandler(signletonToUse, false),
			signletonToUse
		);
		console.dir({
			account: address,
			address: getProxyFromSingleton(signletonToUse),
			abi: GNOSIS_SAFE_PROXY_FACTORY,
			chainId: chain.id,
			functionName: 'createProxyWithNonce',
			args: [signletonToUse, `0x${argInitializers}`, salt],
			prepareWriteAddress,
			singleton,
safeAddress
		});
		try {
			const argInitializers = generateArgInitializers(
				owners,
				threshold,
				toAddress(paymentReceiver),
				getFallbackHandler(signletonToUse, false),
				signletonToUse
			);
			const prepareWriteResult = await simulateContract(config, {
				account: address,
				address: getProxyFromSingleton(signletonToUse),
				abi: GNOSIS_SAFE_PROXY_FACTORY,
				chainId: chain.id,
				functionName: 'createProxyWithNonce',
				args: [signletonToUse, `0x${argInitializers}`, salt]
			});
			prepareWriteAddress = toAddress(prepareWriteResult.result);
			if (prepareWriteAddress === safeAddress) {
				return setCanDeployOnThatChain({canDeploy: true, isLoading: false, method: 'contract'});
			}
		} catch (err) {
			console.error(`Couldn't simulate safe deploy on ${chain.name} because of ${err}`);
		}

		/**************************************************************************************
		** If not successful, try to clone with the ALTERNATE_FALLBACK_HANDLER
		**************************************************************************************/
		try {
			const argInitializersAlt = generateArgInitializers(
				owners,
				threshold,
				toAddress(paymentReceiver),
				getFallbackHandler(signletonToUse, true),
				signletonToUse
			);
			const prepareWriteResultAlt = await simulateContract(config, {
				account: address,
				address: getProxyFromSingleton(signletonToUse),
				abi: GNOSIS_SAFE_PROXY_FACTORY,
				functionName: 'createProxyWithNonce',
				chainId: chain.id,
				args: [signletonToUse, `0x${argInitializersAlt}`, salt]
			});
			prepareWriteAddress = toAddress(prepareWriteResultAlt.result);
			if (prepareWriteAddress === safeAddress) {
				return setCanDeployOnThatChain({canDeploy: true, isLoading: false, method: 'contractAlt'});
			}
		} catch {
			// console.error(`Couldn't simulate safe deploy on ${chain.name} because of ${err}`);
		}

		/**************************************************************************************
		** Otherwise, fallback to the direct call
		**************************************************************************************/
		try {
			const directCall = await call(config, {
				to: toAddress(originalTx?.to),
				account: address,
				data: originalTx?.input,
				chainId: chain.id
			});
			if (directCall?.data) {
				prepareCallAddress = toAddress(`0x${directCall.data.substring(26)}`);
				if (prepareCallAddress === safeAddress) {
					return setCanDeployOnThatChain({canDeploy: true, isLoading: false, method: 'direct'});
				}
			}
		} catch {
			// console.warn(`Couldn't simulate safe direct deploy on ${chain.name} because of ${err}`);
		}
		console.warn(`Couldn't simulate safe direct deploy on ${chain.name}`);
		return setCanDeployOnThatChain({canDeploy: false, isLoading: false, method: 'none'});
	}, [
		address,
		chain.name,
		originalTx?.input,
		originalTx?.to,
		owners,
		paymentReceiver,
		safeAddress,
		salt,
		singleton,
		threshold,
		config,
		chain.id
	]);

	useEffect((): void => {
		checkIfDeployedOnThatChain();
		checkDeploymentExpectedAddress();
	}, [checkDeploymentExpectedAddress, checkIfDeployedOnThatChain]);

	/******************************************************************************************
	 ** When the user clicks on the deploy button, we will try to deploy the safe on the chain
	 ** the user selected.
	 ** This can be done in two ways:
	 ** - Directly, by cloning the original transaction and sending it to the chain.
	 ** - By using the proxy factory to deploy a new safe with the same arguments as the original
	 **   transaction.
	 ******************************************************************************************/
	const onDeploySafe = useCallback(async (): Promise<void> => {
		if (!canDeployOnThatChain.canDeploy) {
			console.error('Cannot deploy on that chain');
			return;
		}

		/******************************************************************************************
		 ** First, make sure we are using the correct chainID to deploy this safe.
		 ******************************************************************************************/
		if (chainID !== chain.id) {
			await switchChain(config, {chainId: chain.id});
		}

		/******************************************************************************************
		 ** Log the deployment info
		 ******************************************************************************************/
		plausible(originalTx ? PLAUSIBLE_EVENTS.CREATE_CLONE_SAFE : PLAUSIBLE_EVENTS.CREATE_NEW_SAFE, {
			props: {
				chainID: chain.id,
				safeAddress
			}
		});

		/******************************************************************************************
		 ** If the method is direct, we will just clone the original transaction.
		 ** As this is not a standard contract call, we kinda clone the handleTX function from the
		 ** weblib.
		 ******************************************************************************************/
		if (canDeployOnThatChain.method === 'direct') {
			setCloneStatus({...defaultTxStatus, pending: true});
			const transactionArgs = {
				to: toAddress(originalTx?.to),
				chainId: chain.id,
				account: address,
				data: originalTx?.input
			};

			try {
				await estimateGas(config, transactionArgs);
			} catch (error) {
				toast.error((error as {shortMessage: string})?.shortMessage || 'Transaction would fail!');
				setCloneStatus({...defaultTxStatus, error: true});
			}

			try {
				const hash = await sendTransaction(config, transactionArgs);
				const receipt = await waitForTransactionReceipt(config, {hash, confirmations: 2});
				if (receipt.status === 'success') {
					setCloneStatus({...defaultTxStatus, success: true});
					checkIfDeployedOnThatChain();
					checkDeploymentExpectedAddress();
					toast.success('Transaction successful!');
				} else {
					setCloneStatus({...defaultTxStatus, error: true});
					toast.error('Transaction failed!');
				}
			} catch (error) {
				toast.error((error as {shortMessage: string})?.shortMessage || 'Transaction failed!');
				setCloneStatus({...defaultTxStatus, error: true});
			} finally {
				setTimeout((): void => {
					setCloneStatus(defaultTxStatus);
				}, 3000);
			}
		}

		/******************************************************************************************
		 ** If the method is contract, we can clone the safe using the proxy factory with the same
		 ** arguments as the original transaction.
		 ******************************************************************************************/
		if (canDeployOnThatChain.method === 'contract' || canDeployOnThatChain.method === 'contractAlt') {
			let fee = 0n;
			if (coinPrice) {
				fee = parseEther((DEFAULT_FEES_USD / coinPrice).toString());
			}
			const signletonToUse = singleton || SINGLETON_L2;
			const argInitializers = generateArgInitializers(
				owners,
				threshold,
				toAddress(paymentReceiver),
				getFallbackHandler(signletonToUse, canDeployOnThatChain.method === 'contractAlt'),
				signletonToUse
			);
			const callDataDisperseEth = {
				target: CHAINS[chain.id].disperseAddress,
				value: fee,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: DISPERSE_ABI,
					functionName: 'disperseEther',
					args: [[toAddress(process.env.SMOL_ADDRESS)], [fee]]
				})
			};

			const callDataCreateSafe = {
				target: getProxyFromSingleton(signletonToUse),
				value: 0n,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: GNOSIS_SAFE_PROXY_FACTORY,
					functionName: 'createProxyWithNonce',
					args: [signletonToUse, `0x${argInitializers}`, salt]
				})
			};

			const multicallData = [];
			if (![5, 1337, 84531].includes(chain.id) && fee !== 0n) {
				multicallData.push(callDataDisperseEth);
			}
			multicallData.push(callDataCreateSafe);
			const allChains = getChains(config);
			const currentNetwork = allChains.find(e => e.id === chain.id);
			if (!currentNetwork?.contracts?.multicall3?.address) {
				console.warn('no multicall3');
				return;
			}

			const result = await multicall({
				config: config,
				connector: connector,
				chainID: chain.id,
				contractAddress: currentNetwork?.contracts?.multicall3?.address,
				multicallData: multicallData,
				statusHandler: setCloneStatus
			});
			if (result.isSuccessful) {
				checkIfDeployedOnThatChain();
				checkDeploymentExpectedAddress();
			}
		}
	}, [
		canDeployOnThatChain.canDeploy,
		canDeployOnThatChain.method,
		chainID,
		chain.id,
		plausible,
		originalTx,
		safeAddress,
		address,
		checkIfDeployedOnThatChain,
		checkDeploymentExpectedAddress,
		coinPrice,
		singleton,
		owners,
		threshold,
		paymentReceiver,
		salt,
		connector,
		config
	]);

	const currentView = {
		Deployed: (
			<div className={'flex items-center gap-2'}>
				<Button
					className={'!h-8'}
					isDisabled>
					<p className={'text-sm'}>{'Deployed'}</p>
				</Button>
				<Link
					href={`${CHAINS[chain.id].safeUIURI || ''}${safeAddress}`}
					target={'_blank'}>
					<Button className={'block !h-8'}>
						<IconLinkOut className={'size-4 !text-black'} />
					</Button>
				</Link>
			</div>
		),
		CanDeploy: (
			<div className={'flex items-center gap-2'}>
				<Button
					className={'!h-8'}
					isBusy={cloneStatus.pending}
					onClick={onDeploySafe}>
					<p className={'text-sm'}>{'Deploy'}</p>
				</Button>
				<p className={'block text-center text-xs text-neutral-600 md:hidden'}>&nbsp;</p>
			</div>
		),
		CannotDeploy: (
			<div>
				<span className={'tooltip flex items-center gap-2'}>
					<Button
						className={'white !h-8'}
						isDisabled>
						{'Impossible'}
					</Button>
					<p className={'block text-center text-xs text-neutral-600 md:hidden'}>&nbsp;</p>

					<span className={'tooltipLight top-full mt-1'}>
						<div
							className={
								'font-number w-40 border border-neutral-300 bg-neutral-100 p-1 px-2 text-center text-xxs text-neutral-900'
							}>
							<p>
								{
									"The Safe was deployed using an un-cloneable legacy method or you don't have enough funds to clone it. Soz 😕"
								}
							</p>
						</div>
					</span>
				</span>
			</div>
		),
		Loading: (
			<div>
				<Button
					className={'!h-8'}
					isBusy>
					<p className={'text-sm'}>{'Loading'}</p>
				</Button>
			</div>
		)
	}[
		canDeployOnThatChain.isLoading
			? 'Loading'
			: isDeployedOnThatChain
				? 'Deployed'
				: canDeployOnThatChain.canDeploy
					? 'CanDeploy'
					: 'CannotDeploy'
	];

	return (
		<div
			key={chain.id}
			className={'box-0 flex w-full flex-col justify-between gap-4 p-4 md:flex-row md:items-center md:gap-0'}>
			<div className={'flex gap-2'}>
				<div className={'size-10'}>
					<Image
						src={`${process.env.SMOL_ASSETS_URL}/chain/${chain.id}/logo-128.png`}
						width={40}
						height={40}
						alt={chain.name}
					/>
				</div>
				<div className={''}>
					<b className={'text-sm text-neutral-700'}>{currentChain?.name}</b>
					<Link
						href={`${currentChain?.blockExplorers?.default.url}/address/${safeAddress}`}
						target={'_blank'}>
						<p className={'text-xs text-neutral-600 transition-colors hover:text-neutral-900'}>
							{truncateHex(safeAddress, 6)}
						</p>
					</Link>
				</div>
			</div>
			<div className={'flex md:justify-end'}>{currentView}</div>
		</div>
	);
}

export default ChainStatus;
