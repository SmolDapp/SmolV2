import React, {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ColoredRatioBar} from 'packages/smol/components/Basket/ColoredRatioBar';
import {decodeFunctionResult, encodeFunctionData, type Hex, hexToBigInt, http} from 'viem';
import {mainnet} from 'viem/chains';
import {useBalance} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, ETH_TOKEN_ADDRESS, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, getNetwork, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {FeeAmount} from '@uniswap/v3-sdk';
import {createConfig, simulateContract} from '@wagmi/core';
import {ReadonlyNetworkInputSelector} from '@lib/common/NetworkSelector/Input';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';
import {Button} from '@lib/primitives/Button';
import DISPERSE_ABI from '@lib/utils/abi/disperse.abi';
import {MULTICALL_ABI} from '@lib/utils/abi/multicall3.abi';
import {UNIQUOTER_ABI} from '@lib/utils/abi/uniQuoter.abi';
import {UNIROUTER_ABI} from '@lib/utils/abi/uniRouter.abi.ts';
import {CHAINS} from '@lib/utils/tools.chains';

import {ReadonlySwapTokenRow, SwapTokenRow} from '../../components/Swap';
import {getNewInputToken} from '../../components/Swap/useSwapFlow.lifi';
import {WalletAppInfo} from '../../components/Wallet/AppInfo';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

const QUOTER_CONTRACT_ADDRESS = toAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6');
const SWAP_ROUTER_ADDRESS = toAddress('0xE592427A0AEce92De3Edee1F18E0157C05861564');
const WETH_ADDRESS = toAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

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
type TBasketToken = TTokenAmountInputElement & {
	share: number;
};

function SwapBasket({
	toTokens,
	set_toTokens
}: {
	toTokens: TBasketToken[];
	set_toTokens: Dispatch<SetStateAction<TBasketToken[]>>;
}): ReactElement {
	const {address} = useWeb3();
	const [txStatus] = useState(defaultTxStatus);
	const [fromToken, set_fromToken] = useState<TTokenAmountInputElement>({
		amount: '0',
		normalizedBigAmount: zeroNormalizedBN,
		status: 'none',
		isValid: true,
		UUID: 'FROM',
		token: {
			address: ETH_TOKEN_ADDRESS,
			balance: zeroNormalizedBN,
			chainID: 1,
			decimals: 18,
			logoURI: 'https://assets.smold.app/api/token/1/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/logo-128.png',
			name: 'Ethereum',
			symbol: 'ETH',
			value: 0
		}
	});

	const {data: balanceOfETH} = useBalance({address, chainId: mainnet.id});
	useEffect(() => {
		set_fromToken((item): TTokenAmountInputElement => {
			return {
				...item,
				token: {
					...item.token,
					balance: toNormalizedBN(balanceOfETH?.value || 0n, 18)
				}
			};
		});
	}, [balanceOfETH]);

	const swap = useCallback(
		async (value: TTokenAmountInputElement, expectedOut: TNormalizedBN[]) => {
			const config = createConfig({
				chains: [mainnet],
				transports: {
					[mainnet.id]: http('https://mainnet.gateway.tenderly.co/2udswqhL2gc0DnnWrrn473')
				}
			});
			const allSwapCalls = [];

			// Fee for smol is 0.15% of the total amount
			const feeForSmol = (toBigInt(value.normalizedBigAmount.raw) * 15n) / 10_000n;
			const feeForCreator = (toBigInt(value.normalizedBigAmount.raw) * 15n) / 10_000n;
			const updatedAmount = toBigInt(value.normalizedBigAmount.raw) - feeForSmol - feeForCreator;

			let index = 0;
			for (const item of toTokens) {
				const amountOut = expectedOut[index++];
				const scaledAmount = (toBigInt(updatedAmount) * BigInt(item.share)) / 100n;
				allSwapCalls.push(
					encodeFunctionData({
						abi: UNIROUTER_ABI,
						functionName: 'exactInputSingle',
						args: [
							{
								tokenIn: WETH_ADDRESS,
								tokenOut: item.token.address,
								fee: FeeAmount.LOW,
								recipient: toAddress(address),
								deadline: toBigInt(Math.floor(Date.now() / 1000) + 60 * 20),
								amountIn: scaledAmount,
								amountOutMinimum: (amountOut.raw * 99n) / 100n,
								sqrtPriceLimitX96: 0n
							}
						]
					})
				);
			}

			const multicallData = [];
			const callDataDisperseEth = {
				target: CHAINS[mainnet.id].disperseAddress,
				value: feeForSmol + feeForCreator,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: DISPERSE_ABI,
					functionName: 'disperseEther',
					args: [
						[toAddress(process.env.SMOL_ADDRESS), toAddress(process.env.SMOL_ADDRESS)],
						[feeForSmol, feeForCreator]
					]
				})
			};
			multicallData.push(callDataDisperseEth);

			const callDataBuyBasket = {
				target: SWAP_ROUTER_ADDRESS,
				value: updatedAmount,
				allowFailure: false,
				callData: encodeFunctionData({
					abi: UNIROUTER_ABI,
					functionName: 'multicall',
					args: [allSwapCalls as readonly Hex[]]
				})
			};
			multicallData.push(callDataBuyBasket);

			try {
				const simulateResult = await simulateContract(config, {
					address: toAddress(getNetwork(mainnet.id).contracts.multicall3?.address),
					abi: MULTICALL_ABI,
					chainId: 1,
					functionName: 'aggregate3Value',
					account: toAddress(address),
					value: value.normalizedBigAmount.raw,
					args: [multicallData]
				});

				index = 0;
				const [, buyBasketResult] = simulateResult.result;
				const decoded = decodeFunctionResult({
					abi: UNIROUTER_ABI,
					functionName: 'multicall',
					data: buyBasketResult.returnData
				});
				console.warn('SIMULATION SUCCESSFUL');
				console.warn(`Amount paid by user: ${value.normalizedBigAmount.display} ETH`);
				console.warn(`Fee for Smol: ${toNormalizedBN(feeForSmol, 18).display} ETH`);
				console.warn(`Fee for Creator: ${toNormalizedBN(feeForCreator, 18).display} ETH`);
				console.warn(`Amount used to buy the basket: ${toNormalizedBN(updatedAmount, 18).display} ETH`);
				for (const result of decoded) {
					const {token} = toTokens[index++];
					console.warn(
						`Receiving ${toNormalizedBN(hexToBigInt(result), token.decimals).display} ${token.symbol}`
					);
				}
			} catch (error) {
				console.warn('SIMULATION FAILED');
				console.warn(error);
			}
		},
		[address, toTokens]
	);

	const getQuote = useCallback(
		async (value: TTokenAmountInputElement) => {
			if (toBigInt(value.normalizedBigAmount.raw) === 0n) {
				set_toTokens((item): TBasketToken[] => {
					return item.map(token => ({
						...token,
						normalizedBigAmount: zeroNormalizedBN,
						amount: '0',
						value: 0
					}));
				});
				return;
			}
			const allCalls = toTokens.map(async item => {
				const scaledAmount = (toBigInt(value.normalizedBigAmount.raw) * BigInt(item.share)) / 100n;
				return simulateContract(retrieveConfig(), {
					abi: UNIQUOTER_ABI,
					address: QUOTER_CONTRACT_ADDRESS,
					functionName: 'quoteExactInputSingle',
					chainId: 1,
					args: [WETH_ADDRESS, toAddress(item.token.address), FeeAmount.LOW, scaledAmount, 0n]
				});
			});
			const results = await Promise.allSettled(allCalls);
			const _toTokensAmount: TNormalizedBN[] = [];
			let index = 0;
			for (const result of results) {
				const {decimals} = toTokens[index++].token;
				if (result.status === 'fulfilled') {
					const {value} = result as PromiseFulfilledResult<{result: bigint}>;
					_toTokensAmount.push(toNormalizedBN(value.result, decimals));
				} else {
					_toTokensAmount.push(zeroNormalizedBN);
				}
			}
			set_toTokens((item): TBasketToken[] => {
				return item.map((token, index) => ({
					...token,
					normalizedBigAmount: _toTokensAmount[index],
					amount: _toTokensAmount[index].display
				}));
			});
		},
		[set_toTokens, toTokens]
	);

	const onHandleSwap = useCallback(async (): Promise<void> => {
		await swap(
			fromToken,
			toTokens.map(item => item.normalizedBigAmount)
		);
	}, [fromToken, swap, toTokens]);

	return (
		<div className={'w-full max-w-screen-sm'}>
			<div>
				<div className={'mb-1 mt-2 w-full items-center md:w-auto'}>
					<div className={cl('flex flex-row gap-2')}>
						<div className={'w-20'}>
							<ReadonlyNetworkInputSelector value={mainnet.id} />
						</div>

						<div className={'w-full'}>
							<SwapTokenRow
								input={fromToken}
								chainIDToUse={mainnet.id}
								onChangeValue={value => {
									set_fromToken(prev => ({...prev, ...value}));
									setTimeout(() => {
										getQuote(value as TTokenAmountInputElement);
									}, 100);
								}}
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
							<div
								key={toAddress(item.token.address)}
								className={cl('flex flex-row gap-2')}>
								<div className={'w-20'}>
									<ReadonlyNetworkInputSelector value={item.token.chainID} />
								</div>
								<div className={'w-full'}>
									<ReadonlySwapTokenRow
										value={item}
										isFetchingQuote={false}
										chainIDToUse={item.token.chainID}
										onChangeValue={() => null}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className={'mt-2'}>
				<div className={'flex flex-row items-center gap-2'}>
					<Button
						className={'!h-8 w-full max-w-[240px] !text-xs'}
						isBusy={txStatus.pending}
						isDisabled={fromToken.normalizedBigAmount.raw === 0n}
						onClick={onHandleSwap}>
						<b>{'Buy basket'}</b>
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function Basket(): ReactElement {
	const [toTokens, set_toTokens] = useState<TBasketToken[]>([
		{
			...getNewInputToken(),
			share: 60,
			token: {
				address: toAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x6b175474e89094c44da98b954eedeac495271d0f/logo-128.png`,
				name: 'Dai Stablecoin',
				symbol: 'DAI',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 40,
			token: {
				address: toAddress('0x83F20F44975D03b1b09e64809B757c47f942BEeA'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x83F20F44975D03b1b09e64809B757c47f942BEeA/logo-128.png`,
				name: 'Saving DAI',
				symbol: 'sDAI',
				value: 0
			}
		}
	]);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<div className={'mb-4 flex flex-wrap gap-2 text-xs'}>
				<Link href={'/baskets/facu'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'Facu'}</Button>
				</Link>
				<Link href={'/baskets/mom'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'MOM'}</Button>
				</Link>
				<Link href={'/baskets/stable'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'Stable'}</Button>
				</Link>
			</div>
			<div className={'flex flex-row gap-4'}>
				<div
					className={
						'grid aspect-square w-fit min-w-fit grid-cols-2 grid-rows-2 gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow'
					}>
					{toTokens.map(item => (
						<div
							key={item.token.address}
							className={'flex flex-col items-center'}>
							<div className={'size-12 rounded-full border border-neutral-200'}>
								<Image
									src={item.token.logoURI || ''}
									alt={item.token.name}
									width={96}
									height={96}
								/>
							</div>
						</div>
					))}
				</div>
				<div className={'py-2'}>
					<b>{'The Facu'}</b>
					<p className={'text-sm text-neutral-600'}>{'sDAI is your savings, and the rest is to buy beers'}</p>
					<p className={'pt-1 text-sm text-neutral-600'}>
						{toTokens.map(item => `${item.token.symbol} (${item.share}%)`).join(', ')}
					</p>
					<Link href={'https://builtby.mom'}>
						<p className={'pt-1 text-sm text-neutral-600 hover:underline'}>{'https://builtby.mom'}</p>
					</Link>
				</div>
			</div>

			<div>
				<div
					className={cl(
						'h-4 w-full rounded-lg border border-neutral-200 bg-neutral-300',
						'relative overflow-hidden flex flex-row'
					)}>
					{toTokens.map(item => (
						<ColoredRatioBar
							key={item.token.address}
							logoURI={item.token.logoURI || ''}
							share={item.share}
						/>
					))}
				</div>
				<div className={cl('w-full overflow-hidden flex flex-row')}>
					{toTokens.map(item => (
						<div
							key={item.token.address}
							className={cl('h-full text-center text-sm font-medium text-neutral-700')}
							style={{width: `${item.share}%`}}>
							{item.token.symbol}
						</div>
					))}
				</div>
			</div>

			<div className={'pt-6'}>
				<SwapBasket
					toTokens={toTokens}
					set_toTokens={set_toTokens}
				/>
			</div>
		</div>
	);
}

Basket.AppName = 'Basket';
Basket.AppDescription = 'Do your stuff. And share it.';
Basket.AppInfo = <WalletAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /
 *************************************************************************************************/
Basket.MetadataTitle = 'Smol - Built by MOM';
Basket.MetadataDescription =
	'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.';
Basket.MetadataURI = 'https://smold.app';
Basket.MetadataOG = 'https://smold.app/og.png';
Basket.MetadataTitleColor = '#000000';
Basket.MetadataThemeColor = '#FFD915';
