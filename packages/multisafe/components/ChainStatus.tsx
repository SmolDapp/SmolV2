import {useCallback, useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import {encodeFunctionData, parseEther} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toAddress, truncateHex} from '@builtbymom/web3/utils';
import {defaultTxStatus, getClient, getNetwork, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useMultisafe} from '@multisafe/contexts/useMultisafe';
import {IconLinkOut} from '@multisafeIcons/IconLinkOut';
import {
	DEFAULT_FEES_USD,
	PROXY_FACTORY_L1,
	PROXY_FACTORY_L2,
	PROXY_FACTORY_L2_DDP,
	SINGLETON_L1,
	SINGLETON_L2,
	SINGLETON_L2_DDP
} from '@multisafeUtils/constants';
import {generateArgInitializers} from '@multisafeUtils/utils';
import {estimateGas, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';
import {Button} from '@lib/primitives/Button';
import {CHAINS} from '@lib/utils/tools.chains';

import DISPERSE_ABI from '../utils/abi/disperse.abi';
import GNOSIS_SAFE_PROXY_FACTORY from '../utils/abi/gnosisSafeProxyFactory.abi';
import {multicall} from '../utils/actions';

import type {ReactElement} from 'react';
import type {Chain} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {GetTransactionReturnType} from '@wagmi/core';

function getProxyFromSingleton(singleton: TAddress): TAddress {
	if (singleton === SINGLETON_L2) {
		return PROXY_FACTORY_L2;
	}
	if (singleton === SINGLETON_L2_DDP) {
		return PROXY_FACTORY_L2_DDP;
	}
	if (singleton === SINGLETON_L1) {
		return PROXY_FACTORY_L1;
	}
	return PROXY_FACTORY_L2;
}

type TChainStatusArgs = {
	chain: Chain;
	safeAddress: TAddress;
	originalTx?: GetTransactionReturnType;
	owners: TAddress[];
	threshold: number;
	salt: bigint;
	singleton?: TAddress;
};

function ChainStatus({
	chain,
	safeAddress,
	originalTx,
	owners,
	threshold,
	salt,
	singleton
}: TChainStatusArgs): ReactElement {
	const {chainCoinPrices} = useMultisafe();
	const gasCoinID = CHAINS?.[chain.id]?.coingeckoGasCoinID || 'ethereum';
	const coinPrice = chainCoinPrices?.[gasCoinID]?.usd;
	const {provider, address, chainID} = useWeb3();
	const [isDeployedOnThatChain, set_isDeployedOnThatChain] = useState(false);
	const [cloneStatus, set_cloneStatus] = useState(defaultTxStatus);
	const [canDeployOnThatChain, set_canDeployOnThatChain] = useState({
		canDeploy: true,
		isLoading: true,
		method: 'contract'
	});

	/* 🔵 - Smold App **************************************************************************
	 ** If the safe is already deployed on that chain, we don't need to do anything.
	 ******************************************************************************************/
	const checkIfDeployedOnThatChain = useCallback(async (): Promise<void> => {
		const publicClient = getClient(chain.id);
		const byteCode = await publicClient.getBytecode({address: safeAddress});
		if (byteCode) {
			set_isDeployedOnThatChain(true);
		} else {
			set_isDeployedOnThatChain(false);
		}
	}, [chain.id, safeAddress]);

	/* 🔵 - Smold App **************************************************************************
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
		const publicClient = getClient(chain.id);
		let prepareWriteAddress = toAddress();
		let prepareCallAddress = toAddress();
		try {
			const signletonToUse = singleton || SINGLETON_L2;
			if (signletonToUse === SINGLETON_L1) {
				return set_canDeployOnThatChain({canDeploy: false, isLoading: false, method: 'none'});
			}
			const argInitializers = generateArgInitializers(owners, threshold);

			const prepareWriteResult = await publicClient.simulateContract({
				account: address,
				address: getProxyFromSingleton(signletonToUse),
				abi: GNOSIS_SAFE_PROXY_FACTORY,
				functionName: 'createProxyWithNonce',
				args: [signletonToUse, `0x${argInitializers}`, salt]
			});
			prepareWriteAddress = toAddress(prepareWriteResult.result);

			if (prepareWriteAddress === safeAddress) {
				return set_canDeployOnThatChain({canDeploy: true, isLoading: false, method: 'contract'});
			}
		} catch (err) {
			console.log(err);
			//
		}

		try {
			const directCall = await publicClient.call({
				to: toAddress(originalTx?.to),
				account: address,
				data: originalTx?.input
			});
			if (directCall?.data) {
				prepareCallAddress = toAddress(`0x${directCall.data.substring(26)}`);
				if (prepareCallAddress === safeAddress) {
					return set_canDeployOnThatChain({canDeploy: true, isLoading: false, method: 'direct'});
				}
			}
		} catch (err) {
			//
		}
		return set_canDeployOnThatChain({canDeploy: false, isLoading: false, method: 'none'});
	}, [address, chain.id, originalTx?.input, originalTx?.to, owners, safeAddress, salt, singleton, threshold]);

	useEffect((): void => {
		checkIfDeployedOnThatChain();
		checkDeploymentExpectedAddress();
	}, [checkDeploymentExpectedAddress, checkIfDeployedOnThatChain]);

	/* 🔵 - Smold App **************************************************************************
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

		/* 🔵 - Smold App **************************************************************************
		 ** First, make sure we are using the correct chainID to deploy this safe.
		 ******************************************************************************************/
		if (chainID !== chain.id) {
			await switchChain(retrieveConfig(), {chainId: chain.id});
		}

		/* 🔵 - Smold App **************************************************************************
		 ** If the method is direct, we will just clone the original transaction.
		 ** As this is not a standard contract call, we kinda clone the handleTX function from the
		 ** weblib.
		 ******************************************************************************************/
		if (canDeployOnThatChain.method === 'direct') {
			set_cloneStatus({...defaultTxStatus, pending: true});
			const transactionArgs = {
				to: toAddress(originalTx?.to),
				chainId: chain.id,
				account: address,
				data: originalTx?.input
			};

			try {
				await estimateGas(retrieveConfig(), transactionArgs);
			} catch (error) {
				toast.error((error as {shortMessage: string})?.shortMessage || 'Transaction would fail!');
				set_cloneStatus({...defaultTxStatus, error: true});
			}

			try {
				const hash = await sendTransaction(retrieveConfig(), transactionArgs);
				const receipt = await waitForTransactionReceipt(retrieveConfig(), {hash, confirmations: 2});
				if (receipt.status === 'success') {
					set_cloneStatus({...defaultTxStatus, success: true});
					checkIfDeployedOnThatChain();
					checkDeploymentExpectedAddress();
					toast.success('Transaction successful!');
				} else {
					set_cloneStatus({...defaultTxStatus, error: true});
					toast.error('Transaction failed!');
				}
			} catch (error) {
				toast.error((error as {shortMessage: string})?.shortMessage || 'Transaction failed!');
				set_cloneStatus({...defaultTxStatus, error: true});
			} finally {
				setTimeout((): void => {
					set_cloneStatus(defaultTxStatus);
				}, 3000);
			}
		}

		/* 🔵 - Smold App **************************************************************************
		 ** If the method is contract, we can clone the safe using the proxy factory with the same
		 ** arguments as the original transaction.
		 ******************************************************************************************/
		if (canDeployOnThatChain.method === 'contract') {
			const fee = parseEther((DEFAULT_FEES_USD / coinPrice).toString());
			const signletonToUse = singleton || SINGLETON_L2;
			const argInitializers = generateArgInitializers(owners, threshold);
			const callDataDisperseEth = {
				target: CHAINS[chain.id].disperseAddress,
				value: fee,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: DISPERSE_ABI,
					functionName: 'disperseEther',
					args: [[toAddress(process.env.RECEIVER_ADDRESS)], [fee]]
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
			if (![5, 1337, 84531].includes(chain.id)) {
				multicallData.push(callDataDisperseEth);
			}
			multicallData.push(callDataCreateSafe);

			const result = await multicall({
				connector: provider,
				chainID: chain.id,
				contractAddress: getNetwork(chain.id).contracts.multicall3?.address,
				multicallData: multicallData,
				statusHandler: set_cloneStatus
			});
			if (result.isSuccessful) {
				checkIfDeployedOnThatChain();
				checkDeploymentExpectedAddress();
			}
		}
	}, [
		address,
		canDeployOnThatChain.canDeploy,
		canDeployOnThatChain.method,
		chain.id,
		checkDeploymentExpectedAddress,
		checkIfDeployedOnThatChain,
		coinPrice,
		originalTx?.input,
		originalTx?.to,
		owners,
		provider,
		chainID,
		salt,
		singleton,
		threshold
	]);

	const currentView = {
		Deployed: (
			<div className={'flex flex-col items-center gap-2 md:flex-row'}>
				<Button
					className={'!h-8'}
					isDisabled>
					<p className={'text-sm'}>{'Deployed'}</p>
				</Button>
				<Link
					href={`${CHAINS[chain.id].safeAPIURI || ''}${safeAddress}`}
					target={'_blank'}>
					<Button className={'hidden !h-8 md:block'}>
						<IconLinkOut className={'size-4 !text-black'} />
					</Button>
					<p className={'block text-center text-xs text-neutral-600 md:hidden'}>{'See on explorer'}</p>
				</Link>
			</div>
		),
		CanDeploy: (
			<div className={'flex flex-col items-center gap-2 md:flex-row'}>
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
				<span className={'tooltip flex flex-col items-center justify-center gap-2 md:flex-row'}>
					<Button
						className={'white !h-8'}
						isDisabled>
						{'Impossible'}
					</Button>
					<p className={'block text-center text-xs text-neutral-600 md:hidden'}>&nbsp;</p>

					<span className={'tooltipLight top-full mt-1'}>
						<div
							className={
								'font-number text-xxs w-40 border border-neutral-300 bg-neutral-100 p-1 px-2 text-center text-neutral-900'
							}>
							<p>{'The Safe was deployed using an un-cloneable legacy method. Soz 😕'}</p>
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
			className={'box-0 flex w-full items-center justify-between p-4'}>
			<div className={'flex flex-row gap-2'}>
				<div className={'size-10'}>
					<Image
						src={`${process.env.SMOL_ASSETS_URL}/chain/${chain.id}/logo-128.png`}
						width={40}
						height={40}
						alt={chain.name}
					/>
				</div>
				<div className={''}>
					<b className={'text-sm text-neutral-700'}>{getNetwork(chain.id).name}</b>
					<Link
						href={`${getNetwork(chain.id).blockExplorers?.default.url}/address/${safeAddress}`}
						target={'_blank'}>
						<p className={'text-xs text-neutral-600 transition-colors hover:text-neutral-900'}>
							{truncateHex(safeAddress, 6)}
						</p>
					</Link>
				</div>
			</div>
			<div className={'flex justify-end'}>{currentView}</div>
		</div>
	);
}

export default ChainStatus;
