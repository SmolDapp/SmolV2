import React, {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {encodePacked, erc20Abi, getCreate2Address, type Hex, isAddressEqual, keccak256} from 'viem';
import {mainnet, optimism} from 'viem/chains';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	cl,
	formatAmount,
	isAddress,
	isEthAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	ZERO_ADDRESS,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {FeeAmount} from '@uniswap/v3-sdk';
import {
	readContract,
	readContracts,
	serialize,
	simulateContract,
	waitForTransactionReceipt,
	writeContract
} from '@wagmi/core';
import {usePrices} from '@lib/contexts/usePrices';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';
import {IconInfoLight} from '@lib/icons/IconInfo';
import {Button} from '@lib/primitives/Button';
import BASKET_ABI from '@lib/utils/abi/basket.abi';
import {UNIQUOTER_ABI} from '@lib/utils/abi/uniQuoter.abi';
import {UNIV2_ROUTER_ABI} from '@lib/utils/abi/uniV2Router.abi';
import {UNIV3_ROUTER_ABI} from '@lib/utils/abi/uniV3Router.abi';
import {VELO_POOL_FACTORY_ABI} from '@lib/utils/abi/veloPoolFactory.abi';
import {VELO_ROUTER_ABI} from '@lib/utils/abi/veloRouter.abi';
import {CHAINS} from '@lib/utils/tools.chains';

import {ReadonlySwapTokenRow, SwapTokenRow} from '../../components/Swap';
import {createUniqueID} from '../Multisafe/utils';
import {BasketTokenDetailsCurtain} from './BasketTokenDetailsCurtain';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddress, TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {ReadContractParameters} from '@wagmi/core';

type TTokenAmountInputElement = {
	amount: string;
	value?: number;
	normalizedBigAmount: TNormalizedBN;
	token: TToken;
	status: 'pending' | 'success' | 'error' | 'none';
	isValid: boolean | 'undetermined';
	error?: string | undefined;
	UUID: string;
};
export type TBasketToken = TTokenAmountInputElement & {
	share: number;
	feeAmount?: (FeeAmount | number)[];
	swapSource?: 'UNI_V3' | 'UNI_V2' | 'SUSHI_V2' | 'VELO_STABLE' | 'VELO_VOLATILE';
};
type TToTokenAmount = TDict<{
	value: TNormalizedBN;
	feeAmount: (FeeAmount | number)[];
	source: TBasketToken['swapSource'];
}>;

type TSwapBasketProps = {
	toTokens: TBasketToken[];
	fromToken: TTokenAmountInputElement;
	set_toTokens: Dispatch<SetStateAction<TBasketToken[]>>;
	set_fromToken: Dispatch<SetStateAction<TTokenAmountInputElement>>;
};
function predictVeloDeterministicAddress(implementation: Hex, salt: Hex, deployer: Hex): Hex {
	const bytecodePrefix = Buffer.from('3d602d80600a3d3981f3363d3d373d3d3d363d73', 'hex');
	const bytecodeAddress = Buffer.from(implementation.replace('0x', ''), 'hex');
	const bytecodeSuffix = Buffer.from('5af43d82803e903d91602b57fd5bf3', 'hex');
	const bytecode = Buffer.concat([bytecodePrefix, bytecodeAddress, bytecodeSuffix]);
	const bytecodeHash = keccak256(bytecode);
	return getCreate2Address({salt, bytecodeHash, from: deployer});
}

type TBasketTokenRow = {
	item: TBasketToken;
	fromToken: TTokenAmountInputElement;
	isFetchingQuotes: boolean;
};
function BasketTokenRow({item, fromToken, isFetchingQuotes}: TBasketTokenRow): ReactElement {
	const [isBasketInfoOpen, set_isBasketInfoOpen] = useState(false);
	return (
		<Fragment>
			<div
				className={cl(
					'flex flex-row gap-2',
					isAddressEqual(item.token.address, fromToken.token.address) ? 'opacity-30' : ''
				)}>
				<div className={'relative w-full'}>
					<ReadonlySwapTokenRow
						canChangeToken={false}
						shouldDisplayTokenSelector={true}
						isFetchingQuote={isFetchingQuotes}
						value={item}
						chainIDToUse={item.token.chainID}
						onChangeValue={() => null}
					/>
					<div
						className={cl(
							'absolute inset-y-0 -right-10 flex items-center',
							item.normalizedBigAmount.raw > 0n ? '' : 'hidden'
						)}>
						<button
							onClick={() => set_isBasketInfoOpen(true)}
							className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}>
							<IconInfoLight className={'size-4'} />
						</button>
					</div>
				</div>
			</div>
			<BasketTokenDetailsCurtain
				isOpen={isBasketInfoOpen}
				onOpenChange={set_isBasketInfoOpen}
				item={item}
				fromToken={fromToken}
			/>
		</Fragment>
	);
}

function encodeUniV3Path(path: TAddress[], fees: number[]): Hex {
	if (path.length != fees.length + 1) {
		throw new Error('path/fee lengths do not match');
	}

	let encoded: Hex = '0x';
	for (let i = 0; i < fees.length; i++) {
		// 20 byte encoding of the address
		encoded += path[i].slice(2);
		// 3 byte encoding of the fee
		encoded += fees[i].toString(16).padStart(6, '0');
	}
	// encode the final token
	encoded += path[path.length - 1].slice(2);

	return encoded as Hex;
}
function simulateUniV3Paths(
	tokensInPath: TAddress[],
	quoterAddress: TAddress,
	chainId: number,
	amountIn: bigint
): {
	calls: Map<string, Promise<any>>;
	source: TBasketToken['swapSource'][];
	fee: FeeAmount[][];
} {
	const feeOptions = [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
	const simulationPromises = new Map<string, Promise<any>>();
	const source: TBasketToken['swapSource'][] = [];
	const fee: FeeAmount[][] = [];

	for (const fee1 of feeOptions) {
		for (const fee2 of feeOptions) {
			const path = tokensInPath;
			const fees = [fee1, fee2];
			const encodedPath = encodeUniV3Path(path, fees);

			const key = `${fee1}-${fee2}`;
			const promise = simulateContract(retrieveConfig(), {
				abi: UNIQUOTER_ABI,
				address: toAddress(quoterAddress),
				functionName: 'quoteExactInput',
				chainId: chainId,
				args: [encodedPath, amountIn]
			});

			simulationPromises.set(key, promise);
			source.push('UNI_V3');
			fee.push([fee1, fee2]);
		}
	}
	return {
		calls: simulationPromises,
		source,
		fee
	};
}

const BASKET_ADDRESSES: TDict<TAddress> = {
	[mainnet.id]: toAddress('0x93f8baf2f3e5ff976b48f9dee15be116494bd9aa'),
	[optimism.id]: toAddress('0xba4a4b2c22324658acfa40cd3d0955c23e59b47d')
};

export function SwapBasket({toTokens, fromToken, set_toTokens, set_fromToken}: TSwapBasketProps): ReactElement {
	const {provider, address} = useWeb3();
	const {getBalance} = useWallet();
	const [txStatus] = useState(defaultTxStatus);
	const [isFetchingQuotes, set_isFetchingQuotes] = useState(false);
	const [wETHAddress, set_wETHAddress] = useState(ZERO_ADDRESS);
	const chainData = CHAINS[fromToken.token.chainID];
	const uniqueIdentifier = useRef<string | undefined>(undefined);

	const {getPrice, pricingHash} = usePrices();

	useEffect(() => {
		const fromPrice = getPrice(fromToken.token);
		const valueOfTokenToSpend = fromToken.normalizedBigAmount.normalized * (fromPrice?.normalized || 0);
		let sumReceive = 0;

		console.log('----------------------------------------------------------------------------');
		console.log(`The user is spending ${valueOfTokenToSpend}$`);
		for (const item of toTokens) {
			const tokenPrice = getPrice(item.token);
			const valueOfTokenToReceive = item.normalizedBigAmount.normalized * (tokenPrice?.normalized || 0);
			const expectedValueToReceive = valueOfTokenToSpend * (item.share / 100);
			const slippage = ((valueOfTokenToReceive - expectedValueToReceive) / expectedValueToReceive) * 100;
			sumReceive += valueOfTokenToReceive;
			console.log(
				`${item.token.symbol}: ${formatAmount(valueOfTokenToReceive, 2, 2)}$ / ${formatAmount(expectedValueToReceive, 2, 2)}$ (slippage ${formatAmount(slippage, 2, 2)}% via ${item.swapSource} fees ${item.feeAmount})`
			);
		}
		console.log(`The user will receive ${sumReceive}$ in total`);
		console.log('----------------------------------------------------------------------------');
	}, [pricingHash, getPrice, fromToken.token, toTokens, fromToken.normalizedBigAmount.normalized]);

	/**********************************************************************************************
	 ** Check if we can use the basket swap feature. If we don't have any router available, we
	 ** can't swap.
	 *********************************************************************************************/
	const hasAvailableSwapRouter = useMemo(() => {
		return (
			isAddress(chainData.swapSources.uniV2Router) ||
			isAddress(chainData.swapSources.uniV3Router) ||
			isAddress(chainData.swapSources.sushiV2Router) ||
			isAddress(chainData.swapSources.veloRouter)
		);
	}, [
		chainData.swapSources.sushiV2Router,
		chainData.swapSources.uniV2Router,
		chainData.swapSources.uniV3Router,
		chainData.swapSources.veloRouter
	]);

	/**********************************************************************************************
	 ** This combinaison of useMemo and useEffect is used to retrieve the current balance of the
	 ** fromToken to update the balance of the token in the UI. Without this hook, the balance
	 ** won't be loaded and the UI would account for no token for that user, resulting in
	 ** `Not enough balance` error.
	 *********************************************************************************************/
	const balanceOfFrom = useMemo(() => {
		return getBalance({
			address: fromToken.token.address,
			chainID: fromToken.token.chainID
		});
	}, [getBalance, fromToken.token.address, fromToken.token.chainID]);
	useEffect(() => {
		if (balanceOfFrom === undefined || balanceOfFrom.raw > 0n) {
			set_fromToken((item): TTokenAmountInputElement => {
				return {
					...item,
					token: {
						...item.token,
						balance: balanceOfFrom
					}
				};
			});
		}
	}, [balanceOfFrom, set_fromToken]);

	/**********************************************************************************************
	 ** We don't know the Wrapped Currency address for the chain. We could add a general mapping or
	 ** we could query the routers to get the address and use it. We chose the latter.
	 ** This will check for the UniV2, UniV3 and SushiV2 routers to get the WETH or WETH9 address
	 ** for the chain.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		const contracts: ReadContractParameters[] = [];

		if (isAddress(chainData.swapSources.uniV2Router)) {
			contracts.push({
				abi: UNIV2_ROUTER_ABI,
				chainId: fromToken.token.chainID,
				address: chainData.swapSources.uniV2Router,
				functionName: 'WETH'
			});
		}
		if (isAddress(chainData.swapSources.uniV3Router)) {
			contracts.push({
				abi: UNIV3_ROUTER_ABI,
				chainId: fromToken.token.chainID,
				address: chainData.swapSources.uniV3Router,
				functionName: 'WETH9'
			});
		}
		if (isAddress(chainData.swapSources.sushiV2Router)) {
			contracts.push({
				abi: UNIV2_ROUTER_ABI,
				chainId: fromToken.token.chainID,
				address: chainData.swapSources.sushiV2Router,
				functionName: 'WETH'
			});
		}
		if (isAddress(chainData.swapSources.veloRouter)) {
			contracts.push({
				abi: VELO_ROUTER_ABI,
				chainId: fromToken.token.chainID,
				address: chainData.swapSources.veloRouter,
				functionName: 'weth'
			});
		}
		const result = await readContracts(retrieveConfig(), {contracts: contracts as any});
		const wethAddress =
			result[0]?.result || result[1]?.result || result[2]?.result || result[3]?.result || ZERO_ADDRESS;
		set_wETHAddress(toAddress(wethAddress as unknown as string));
	}, [
		chainData.swapSources.sushiV2Router,
		chainData.swapSources.uniV2Router,
		chainData.swapSources.uniV3Router,
		chainData.swapSources.veloRouter,
		fromToken.token.chainID
	]);

	/**********************************************************************************************
	 ** Execute the swap based on the quotes
	 *********************************************************************************************/
	const swapWithBasketSC = useCallback(async () => {
		const feeForSmol = (toBigInt(fromToken.normalizedBigAmount.raw) * 30n) / 10_000n;
		const amountForSwap = toBigInt(fromToken.normalizedBigAmount.raw) - feeForSmol;
		const fromTokenAddress = isEthAddress(fromToken.token.address)
			? wETHAddress
			: toAddress(fromToken.token.address);

		/*=======================================================================================*/
		const callDataBasket = [];
		for (const item of toTokens) {
			const amountForSwap = (fromToken.normalizedBigAmount.raw * BigInt(item.share)) / 100n;
			const source = item.swapSource;
			if (fromTokenAddress === item.token.address) {
				continue;
			}
			if (source === 'UNI_V3') {
				callDataBasket.push({
					tokenIn: fromTokenAddress,
					tokenOut: item.token.address,
					amountIn: amountForSwap,
					amountOutMin: (item.normalizedBigAmount.raw * 99n) / 100n,
					dex: 2,
					fee: item.feeAmount ? item.feeAmount[0] : FeeAmount.MEDIUM,
					recipient: toAddress(address),
					sqrtPriceLimitX96: 0n,
					stable: false,
					factory: ZERO_ADDRESS
				});
			} else if (source === 'UNI_V2') {
				callDataBasket.push({
					tokenIn: fromTokenAddress,
					tokenOut: item.token.address,
					amountIn: amountForSwap,
					amountOutMin: (item.normalizedBigAmount.raw * 99n) / 100n,
					dex: 0,
					fee: 0,
					recipient: toAddress(address),
					sqrtPriceLimitX96: 0n,
					stable: false,
					factory: ZERO_ADDRESS
				});
			} else if (source === 'SUSHI_V2') {
				callDataBasket.push({
					tokenIn: fromTokenAddress,
					tokenOut: item.token.address,
					amountIn: amountForSwap,
					amountOutMin: (item.normalizedBigAmount.raw * 99n) / 100n,
					dex: 1,
					fee: 0,
					recipient: toAddress(address),
					sqrtPriceLimitX96: 0n,
					stable: false,
					factory: ZERO_ADDRESS
				});
			} else if (source === 'VELO_STABLE') {
				callDataBasket.push({
					tokenIn: fromTokenAddress,
					tokenOut: item.token.address,
					amountIn: amountForSwap,
					amountOutMin: (item.normalizedBigAmount.raw * 99n) / 100n,
					dex: 3,
					fee: 0,
					recipient: toAddress(address),
					sqrtPriceLimitX96: 0n,
					stable: true,
					factory: toAddress(chainData.swapSources.veloPoolFactory)
				});
			} else if (source === 'VELO_VOLATILE') {
				callDataBasket.push({
					tokenIn: fromTokenAddress,
					tokenOut: item.token.address,
					amountIn: amountForSwap,
					amountOutMin: (item.normalizedBigAmount.raw * 99n) / 100n,
					dex: 3,
					fee: 0,
					recipient: toAddress(address),
					sqrtPriceLimitX96: 0n,
					stable: false,
					factory: toAddress(chainData.swapSources.veloPoolFactory)
				});
			}
		}

		try {
			const simulateResult = await simulateContract(retrieveConfig(), {
				address: BASKET_ADDRESSES[fromToken.token.chainID],
				abi: BASKET_ABI,
				chainId: fromToken.token.chainID,
				functionName: 'multicall',
				account: toAddress(address),
				value: isEthAddress(fromToken.token.address) ? fromToken.normalizedBigAmount.raw : 0n,
				args: [callDataBasket]
			});
			console.log({simulateResult: simulateResult.result});
			console.warn('SIMULATION SUCCESSFUL');
			console.warn(`Amount paid by user: ${fromToken.normalizedBigAmount.display} ETH`);
			console.warn(`Fee for Smol: ${toNormalizedBN(feeForSmol, 18).display} ETH`);
			console.warn(`Amount used to buy the basket: ${toNormalizedBN(amountForSwap, 18).display} ETH`);
			console.warn(`Sources used: ${toTokens.map(item => item.swapSource).join(', ')}`);
		} catch (error) {
			console.warn('SIMULATION FAILED');
			console.error((error as any).message);
		}

		/******************************************************************************************
		 ** We need to ensure the correct allowance has been set for the fromToken. If the user
		 ** didn't approve the basket contract to spend their tokens, we need to do it.
		 ******************************************************************************************/
		const hasAllowance = await readContract(retrieveConfig(), {
			abi: erc20Abi,
			address: fromToken.token.address,
			functionName: 'allowance',
			chainId: fromToken.token.chainID,
			args: [toAddress(address), BASKET_ADDRESSES[fromToken.token.chainID]]
		});
		if (toBigInt(hasAllowance) < fromToken.normalizedBigAmount.raw) {
			const approveResult = await approveERC20({
				amount: fromToken.normalizedBigAmount.raw,
				contractAddress: fromToken.token.address,
				chainID: fromToken.token.chainID,
				connector: provider,
				spenderAddress: BASKET_ADDRESSES[fromToken.token.chainID]
			});
			console.warn(approveResult);
		}

		/******************************************************************************************
		 ** We can now execute the swap. We will call the multicall function of the basket contract
		 ** with the callDataBasket array as argument.
		 ******************************************************************************************/
		const resultHash = await writeContract(retrieveConfig(), {
			address: BASKET_ADDRESSES[fromToken.token.chainID],
			abi: BASKET_ABI,
			chainId: fromToken.token.chainID,
			functionName: 'multicall',
			value: isEthAddress(fromToken.token.address) ? fromToken.normalizedBigAmount.raw : 0n,
			args: [callDataBasket]
		});
		const receipt = await waitForTransactionReceipt(retrieveConfig(), {
			hash: resultHash,
			confirmations: 1
		});
		if (receipt.status === 'success') {
			console.log('Success');
		}
	}, [
		address,
		chainData.swapSources.veloPoolFactory,
		fromToken.normalizedBigAmount.display,
		fromToken.normalizedBigAmount.raw,
		fromToken.token.address,
		fromToken.token.chainID,
		provider,
		toTokens,
		wETHAddress
	]);

	/**********************************************************************************************
	 ** Retrieve all quotes
	 *********************************************************************************************/
	const getQuotes = useCallback(
		async (_fromToken: TTokenAmountInputElement) => {
			/**************************************************************************************
			 ** The first thing we do is resetting the state to indicates we are fetching the
			 ** quotes. We also create a unique identifier for the current call to be able to
			 ** stop the update if the _fromToken input has changed.
			 *************************************************************************************/
			const currentIdentifier = createUniqueID(serialize(_fromToken));
			uniqueIdentifier.current = currentIdentifier;
			set_toTokens((item): TBasketToken[] => {
				return item.map(token => ({
					...token,
					normalizedBigAmount: zeroNormalizedBN,
					amount: '0',
					value: 0
				}));
			});
			set_isFetchingQuotes(false);

			/**************************************************************************************
			 ** If the new fromToken amount is 0, we don't need to fetch the quotes and we can do
			 ** an early return as we already reset the state.
			 *************************************************************************************/
			if (toBigInt(_fromToken.normalizedBigAmount.raw) === 0n) {
				return;
			}

			set_isFetchingQuotes(true);
			const fromTokenAddress = isEthAddress(_fromToken.token.address) ? wETHAddress : _fromToken.token.address;
			const feeForSmol = (toBigInt(_fromToken.normalizedBigAmount.raw) * 30n) / 10_000n;
			const amountForSwap = toBigInt(_fromToken.normalizedBigAmount.raw) - feeForSmol;
			let chunkSize = 0;

			/**************************************************************************************
			 ** For each token in the basket, we will prepare the calls to get the quotes from the
			 ** available sources.
			 ** Depending on the source, this might be a read or a simulate call.
			 *************************************************************************************/
			const allCalls = [];
			const allCallsSources: TBasketToken['swapSource'][] = [];
			const allCallsFees: (FeeAmount | number | 'dynamic')[][] = [];
			for (const item of toTokens) {
				const scaledAmountIn = (amountForSwap * BigInt(item.share)) / 100n;
				const toTokenAddress = toAddress(item.token.address);
				const preparedCalls = [];

				/**********************************************************************************
				 ** If the veloRouter swap source is available add the relevant calls to the
				 ** preparedCalls array:
				 ** - getAmountsOut for stable and unstable tokens
				 ** - getFeeAmount for stable and unstable swap pool
				 *********************************************************************************/
				if (chainData.swapSources.veloRouter) {
					const veloArgs = {
						from: fromTokenAddress,
						to: toTokenAddress,
						factory: toAddress(chainData.swapSources.veloPoolFactory)
					};

					const implementation = toAddress('0x95885Af5492195F0754bE71AD1545Fe81364E531');
					const deployer = toAddress(chainData.swapSources.veloPoolFactory);
					const salt = keccak256(
						encodePacked(['address', 'address', 'bool'], [fromTokenAddress, toTokenAddress, false])
					);
					preparedCalls.push(
						...[
							readContract(retrieveConfig(), {
								abi: VELO_POOL_FACTORY_ABI,
								address: toAddress(chainData.swapSources.veloPoolFactory),
								functionName: 'getFee',
								chainId: item.token.chainID,
								args: [predictVeloDeterministicAddress(implementation, salt, deployer), true]
							}),
							readContract(retrieveConfig(), {
								abi: VELO_ROUTER_ABI,
								address: chainData.swapSources.veloRouter,
								functionName: 'getAmountsOut',
								chainId: item.token.chainID,
								args: [scaledAmountIn, [{...veloArgs, stable: true}]]
							}),
							readContract(retrieveConfig(), {
								abi: VELO_POOL_FACTORY_ABI,
								address: toAddress(chainData.swapSources.veloPoolFactory),
								functionName: 'getFee',
								chainId: item.token.chainID,
								args: [predictVeloDeterministicAddress(implementation, salt, deployer), false]
							}),
							readContract(retrieveConfig(), {
								abi: VELO_ROUTER_ABI,
								address: chainData.swapSources.veloRouter,
								functionName: 'getAmountsOut',
								chainId: item.token.chainID,
								args: [scaledAmountIn, [{...veloArgs, stable: false}]]
							})
						]
					);
					allCallsSources.push('VELO_STABLE');
					allCallsSources.push('VELO_VOLATILE');
					allCallsFees.push(['dynamic']);
					allCallsFees.push(['dynamic']);
				}

				/**********************************************************************************
				 ** If the sushiV2Router swap source is available add the relevant calls to the
				 ** preparedCalls array:
				 ** - getAmountsOut for the token pair
				 *********************************************************************************/
				if (chainData.swapSources.sushiV2Router) {
					preparedCalls.push(
						readContract(retrieveConfig(), {
							abi: UNIV2_ROUTER_ABI,
							address: toAddress(chainData.swapSources.sushiV2Router),
							functionName: 'getAmountsOut',
							chainId: item.token.chainID,
							args: [scaledAmountIn, [fromTokenAddress, toTokenAddress]]
						})
					);
					allCallsSources.push('SUSHI_V2');
					allCallsFees.push([FeeAmount.MEDIUM]);
				}

				/**********************************************************************************
				 ** If the uniV2Router swap source is available add the relevant calls to the
				 ** preparedCalls array:
				 ** - getAmountsOut for the token pair
				 *********************************************************************************/
				if (chainData.swapSources.uniV2Router) {
					preparedCalls.push(
						readContract(retrieveConfig(), {
							abi: UNIV2_ROUTER_ABI,
							address: toAddress(chainData.swapSources.uniV2Router),
							functionName: 'getAmountsOut',
							chainId: item.token.chainID,
							args: [scaledAmountIn, [fromTokenAddress, toTokenAddress]]
						})
					);
					allCallsSources.push('UNI_V2');
					allCallsFees.push([FeeAmount.MEDIUM]);
				}

				/**********************************************************************************
				 ** If the uniV3Router swap source is available add the relevant simulate calls to
				 ** the preparedCalls array:
				 ** - quoteExactInputSingle for the token pair with the lowest fee
				 ** - quoteExactInputSingle for the token pair with the low fee
				 ** - quoteExactInputSingle for the token pair with the medium fee
				 ** - quoteExactInputSingle for the token pair with the high fee
				 *********************************************************************************/
				if (chainData.swapSources.uniV3Router) {
					preparedCalls.push(
						...[
							simulateContract(retrieveConfig(), {
								abi: UNIQUOTER_ABI,
								address: toAddress(chainData.swapSources.uniV3Quoter),
								functionName: 'quoteExactInputSingle',
								chainId: item.token.chainID,
								args: [fromTokenAddress, item.token.address, FeeAmount.LOWEST, scaledAmountIn, 0n]
							}),
							simulateContract(retrieveConfig(), {
								abi: UNIQUOTER_ABI,
								address: toAddress(chainData.swapSources.uniV3Quoter),
								functionName: 'quoteExactInputSingle',
								chainId: item.token.chainID,
								args: [fromTokenAddress, item.token.address, FeeAmount.LOW, scaledAmountIn, 0n]
							}),
							simulateContract(retrieveConfig(), {
								abi: UNIQUOTER_ABI,
								address: toAddress(chainData.swapSources.uniV3Quoter),
								functionName: 'quoteExactInputSingle',
								chainId: item.token.chainID,
								args: [fromTokenAddress, item.token.address, FeeAmount.MEDIUM, scaledAmountIn, 0n]
							}),
							simulateContract(retrieveConfig(), {
								abi: UNIQUOTER_ABI,
								address: toAddress(chainData.swapSources.uniV3Quoter),
								functionName: 'quoteExactInputSingle',
								chainId: item.token.chainID,
								args: [fromTokenAddress, item.token.address, FeeAmount.HIGH, scaledAmountIn, 0n]
							})
						]
					);
					allCallsSources.push('UNI_V3');
					allCallsSources.push('UNI_V3');
					allCallsSources.push('UNI_V3');
					allCallsSources.push('UNI_V3');
					allCallsFees.push([FeeAmount.LOWEST]);
					allCallsFees.push([FeeAmount.LOW]);
					allCallsFees.push([FeeAmount.MEDIUM]);
					allCallsFees.push([FeeAmount.HIGH]);
				}

				if (chainData.swapSources.uniV3Router) {
					const multipleStepsSwaps = simulateUniV3Paths(
						[fromTokenAddress, wETHAddress, item.token.address],
						toAddress(chainData.swapSources.uniV3Quoter),
						item.token.chainID,
						scaledAmountIn
					);
					preparedCalls.push(...multipleStepsSwaps.calls.values());
					allCallsSources.push(...multipleStepsSwaps.source);
					allCallsFees.push(...multipleStepsSwaps.fee);
				}

				/**********************************************************************************
				 ** Append the calls and set the chunkSize to the length of the preparedCalls array
				 ** so we can chunk the results later.
				 *********************************************************************************/
				allCalls.push(...preparedCalls);
				if (chunkSize === 0) {
					chunkSize = preparedCalls.length;
				}
			}

			const results = await Promise.allSettled(allCalls);
			const _toTokensAmount: TToTokenAmount = {};
			let chunckIndex = 0;
			let callIndex = 0;
			for (const item of toTokens) {
				const chunk = results.slice(chunckIndex, chunckIndex + chunkSize);
				chunckIndex += chunkSize;
				console.warn(chunk);

				let currentIndex = 0;
				while (currentIndex < chunk.length) {
					let feeAmount = allCallsFees[callIndex] as (FeeAmount | number)[];
					if (allCallsFees[callIndex][0] === 'dynamic') {
						const {value} = chunk[currentIndex] as PromiseFulfilledResult<bigint>;
						const bigValue = value;
						feeAmount[0] = Number(bigValue);
						currentIndex++;
					}
					feeAmount = feeAmount as (FeeAmount | number)[];

					const thisChunk = chunk[currentIndex];
					const {address, decimals} = item.token;
					const source = allCallsSources[callIndex];

					callIndex++;

					if (thisChunk.status === 'fulfilled') {
						let normalizedValue = zeroNormalizedBN;

						if (source === 'VELO_STABLE' || source === 'VELO_VOLATILE') {
							const {value} = thisChunk as PromiseFulfilledResult<bigint[]>;
							const bigValue = value[value.length - 1];
							normalizedValue = toNormalizedBN(bigValue, decimals);
						}

						if (source === 'UNI_V2' || source === 'SUSHI_V2') {
							const {value} = thisChunk as PromiseFulfilledResult<bigint[]>;
							const bigValue = value[value.length - 1];
							normalizedValue = toNormalizedBN(bigValue, decimals);
						}

						if (source === 'UNI_V3') {
							const {value} = thisChunk as PromiseFulfilledResult<{result: bigint}>;
							const bigValue = value.result as bigint;
							normalizedValue = toNormalizedBN(bigValue, decimals);
						}

						console.log(`OUTPUT with ${source} and fee ${feeAmount}: ${normalizedValue.display}`);

						/**************************************************************************
						 ** If the address is not in the dictionary, we add it with the value we
						 ** got.
						 ** Otherwise, we check if the value we got is higher than the one we
						 ** already have. If it is, we replace it as this means we have a better
						 ** quote.
						 *************************************************************************/
						if (!_toTokensAmount[address]) {
							_toTokensAmount[address] = {value: normalizedValue, feeAmount, source};
						} else if (toBigInt(_toTokensAmount[address].value.raw) < normalizedValue.raw) {
							_toTokensAmount[address] = {value: normalizedValue, feeAmount, source};
						}
					} else {
						if (!_toTokensAmount[address]) {
							_toTokensAmount[address] = {value: zeroNormalizedBN, feeAmount, source};
						}
					}
					currentIndex++;
				}
			}
			if (uniqueIdentifier.current !== currentIdentifier) {
				return;
			}
			set_toTokens((item): TBasketToken[] => {
				return item.map(token => ({
					...token,
					normalizedBigAmount: _toTokensAmount[token.token.address].value,
					amount: _toTokensAmount[token.token.address].value.display,
					feeAmount: _toTokensAmount[token.token.address].feeAmount,
					swapSource: _toTokensAmount[token.token.address].source
				}));
			});
			set_isFetchingQuotes(false);
		},
		[
			chainData.swapSources.sushiV2Router,
			chainData.swapSources.uniV2Router,
			chainData.swapSources.uniV3Quoter,
			chainData.swapSources.uniV3Router,
			chainData.swapSources.veloPoolFactory,
			chainData.swapSources.veloRouter,
			set_toTokens,
			toTokens,
			wETHAddress
		]
	);

	const onHandleSwap = useCallback(async (): Promise<void> => {
		await swapWithBasketSC();
	}, [swapWithBasketSC]);

	const onChangeFromValue = useCallback(
		(value: Partial<TTokenAmountInputElement>): void => {
			const updatedValue = {
				...fromToken,
				...value,
				amount: !value.amount ? 0n || '' : value.amount,
				normalizedBigAmount: !value.normalizedBigAmount ? zeroNormalizedBN : value.normalizedBigAmount,
				value: value.value || undefined
			};
			set_fromToken(updatedValue);
			getQuotes(updatedValue);
		},
		[fromToken, getQuotes, set_fromToken]
	);

	const onHandleLogBalances = useCallback(async (): Promise<void> => {
		const token0Balance = await readContract(retrieveConfig(), {
			abi: erc20Abi,
			address: toTokens[0].token.address,
			functionName: 'balanceOf',
			args: [toAddress(address)]
		});
		const token1Balance = await readContract(retrieveConfig(), {
			abi: erc20Abi,
			address: toTokens[1].token.address,
			functionName: 'balanceOf',
			args: [toAddress(address)]
		});
		const token2Balance = await readContract(retrieveConfig(), {
			abi: erc20Abi,
			address: toTokens[2].token.address,
			functionName: 'balanceOf',
			args: [toAddress(address)]
		});
		console.warn(
			`Balance of ${toTokens[0].token.symbol}: ${toNormalizedBN(token0Balance, toTokens[0].token.decimals).display}`
		);
		console.warn(
			`Balance of ${toTokens[1].token.symbol}: ${toNormalizedBN(token1Balance, toTokens[1].token.decimals).display}`
		);
		console.warn(
			`Balance of ${toTokens[2].token.symbol}: ${toNormalizedBN(token2Balance, toTokens[2].token.decimals).display}`
		);
	}, [address, toTokens]);

	return (
		<div className={'w-full max-w-screen-sm'}>
			<div>
				<div className={'mb-1 mt-2 w-full items-center md:w-auto'}>
					<div className={cl('flex flex-row gap-2')}>
						<div className={'w-full'}>
							<SwapTokenRow
								input={fromToken}
								chainIDToUse={fromToken.token.chainID}
								onChangeValue={onChangeFromValue}
							/>
						</div>
					</div>

					<div className={'my-4 flex w-full items-end justify-center'}>
						<div className={'bg-neutral-0 rounded-lg border border-neutral-400 p-2 text-neutral-600'}>
							<IconChevronBottom className={'size-6 transition-colors'} />
						</div>
					</div>

					<div className={'grid gap-2'}>
						{toTokens.map(item => (
							<BasketTokenRow
								key={toAddress(item.token.address)}
								item={item}
								fromToken={fromToken}
								isFetchingQuotes={isFetchingQuotes}
							/>
						))}
					</div>
				</div>
			</div>

			<div className={'mt-2'}>
				<div className={'flex flex-row items-center gap-2'}>
					<Button
						className={'!h-8 w-full max-w-[240px] !text-xs'}
						isBusy={txStatus.pending}
						isDisabled={fromToken.normalizedBigAmount.raw === 0n || !hasAvailableSwapRouter}
						onClick={onHandleSwap}>
						<b>{'Buy basket'}</b>
					</Button>

					<Button
						className={'!h-8 w-full max-w-[240px] !text-xs'}
						onClick={onHandleLogBalances}>
						<b>{'Log balances'}</b>
					</Button>
				</div>
			</div>
		</div>
	);
}
