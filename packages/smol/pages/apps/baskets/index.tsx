import React, {useMemo} from 'react';
import Link from 'next/link';
import {ColoredRatioBar} from 'packages/smol/components/Basket/ColoredRatioBar';
import {DisperseAppInfo} from 'packages/smol/components/Disperse/AppInfo';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {cl, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {IconBasket} from '@lib/icons/IconBasket';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

const baskets = {
	// 1: {
	// 	ID: 1,
	// 	slug: 'the-stable-boy',
	// 	name: 'The Stable Boy',
	// 	chainID: 1,
	// 	tokens: [
	// 		{
	// 			address: toAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
	// 			share: 34,
	// 			symbol: 'DAI'
	// 		},
	// 		{
	// 			address: toAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
	// 			share: 33,
	// 			symbol: 'USDC'
	// 		},
	// 		{
	// 			address: toAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
	// 			share: 33,
	// 			symbol: 'USDT'
	// 		}
	// 	]
	// },
	// 2: {
	// 	ID: 1,
	// 	slug: 'the-optimist',
	// 	name: 'The Optimist',
	// 	chainID: 10,
	// 	tokens: [
	// 		{
	// 			address: toAddress('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'),
	// 			share: 40,
	// 			symbol: 'DAI'
	// 		},
	// 		{
	// 			address: toAddress('0x4200000000000000000000000000000000000042'),
	// 			share: 50,
	// 			symbol: 'OP'
	// 		},
	// 		{
	// 			address: toAddress('0x9560e827af36c94d2ac33a39bce1fe78631088db'),
	// 			share: 10,
	// 			symbol: 'Velo'
	// 		}
	// 	]
	// },
	// 3: {
	// 	ID: 2,
	// 	slug: 'the-passive-income',
	// 	name: 'The Passive Income',
	// 	chainID: 1,
	// 	tokens: [
	// 		{
	// 			address: toAddress('0x83F20F44975D03b1b09e64809B757c47f942BEeA'),
	// 			share: 80,
	// 			symbol: 'sDAI'
	// 		},
	// 		{
	// 			address: toAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
	// 			share: 20,
	// 			symbol: 'stETH'
	// 		}
	// 	]
	// },
	1: {
		ID: 1,
		slug: 'the-stable-boy',
		name: 'The Stable Boy',
		chainID: 42161,
		tokens: [
			{
				address: toAddress('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'),
				share: 34,
				symbol: 'DAI'
			},
			{
				address: toAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
				share: 33,
				symbol: 'USDC'
			},
			{
				address: toAddress('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
				share: 33,
				symbol: 'USDT'
			}
		]
	},
	4: {
		ID: 2,
		slug: 'arb-chads',
		name: 'Arb Chads',
		chainID: 42161,
		tokens: [
			{
				address: toAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
				share: 30,
				symbol: 'USDC'
			},
			{
				address: toAddress('0x5979D7b546E38E414F7E9822514be443A4800529'),
				share: 20,
				symbol: 'wstETH'
			},
			{
				address: toAddress('0x912CE59144191C1204E64559FE8253a0e49E6548'),
				share: 50,
				symbol: 'ARB'
			}
		]
	}
};

function BasketTokenIcon(props: {address: TAddress; chainID: number; index: number}): ReactElement {
	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** The tokenIcon memoized value contains the URL of the token icon. Based on the provided
	 ** information and what we have in the token list, we will try to find the correct icon source
	 *********************************************************************************************/
	const tokenIcon = useMemo(() => {
		const shouldUseIconFromTokenList = false;
		if (shouldUseIconFromTokenList) {
			const tokenFromList = getToken({address: props.address, chainID: props.chainID});
			if (tokenFromList?.logoURI) {
				return tokenFromList.logoURI;
			}
		}
		return `${process.env.SMOL_ASSETS_URL}/token/${props.chainID}/${props.address}/logo-128.png`;
	}, [getToken, props.address, props.chainID]);

	return (
		<div className={cl('flex flex-col items-center', props.index === 0 ? '' : '-ml-5')}>
			<div className={'size-10 rounded-full border border-neutral-200'}>
				<ImageWithFallback
					src={tokenIcon}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.chainID}/${props.address}/logo-128.png`}
					unoptimized
					alt={''}
					width={40}
					height={40}
				/>
			</div>
		</div>
	);
}
function BasketTokenShareLine(props: {
	address: TAddress;
	symbol: string;
	share: number;
	chainID: number;
}): ReactElement {
	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** The tokenIcon memoized value contains the URL of the token icon. Based on the provided
	 ** information and what we have in the token list, we will try to find the correct icon source
	 *********************************************************************************************/
	const tokenIcon = useMemo(() => {
		const shouldUseIconFromTokenList = false;
		if (shouldUseIconFromTokenList) {
			const tokenFromList = getToken({address: props.address, chainID: props.chainID});
			if (tokenFromList?.logoURI) {
				return tokenFromList.logoURI;
			}
		}
		return `${process.env.SMOL_ASSETS_URL}/token/${props.chainID}/${props.address}/logo-128.png`;
	}, [getToken, props.address, props.chainID]);

	return (
		<div className={'group flex w-full cursor-help items-center justify-center gap-2'}>
			<p className={'w-16 text-sm text-neutral-600'}>{props.symbol}</p>
			<div className={'relative h-4 w-full'}>
				<ColoredRatioBar
					key={props.address}
					logoURI={tokenIcon}
					share={props.share}
				/>
			</div>
			<p
				className={
					'text-xs text-neutral-900 opacity-20 transition-opacity duration-500 group-hover:opacity-100'
				}>
				{`(${props.share}%)`}
			</p>
		</div>
	);
}

function BasketsPage(): ReactElement {
	return (
		<div className={'grid grid-cols-2 gap-4'}>
			{Object.values(baskets).map(basket => (
				<div
					key={basket.slug}
					className={'mb-4 rounded-xl bg-neutral-200 p-6'}>
					<div>
						<div className={'mb-6 flex flex-row gap-2 border-b border-neutral-400/80 pb-4'}>
							<div className={'flex flex-row'}>
								{basket.tokens.map((item, index) => (
									<BasketTokenIcon
										key={item.address}
										address={item.address}
										chainID={basket.chainID}
										index={index}
									/>
								))}
							</div>
							<div className={'flex w-full justify-between gap-4'}>
								<div>
									<b>{basket.name}</b>
									<p className={'text-xs text-neutral-600'}>
										{`#${basket.ID} on ${basket.chainID === 10 ? 'Optimism' : getNetwork(basket.chainID).name}`}
									</p>
								</div>
								<Link href={`/apps/baskets/${basket.slug}`}>
									<div
										className={cl(
											'cursor-pointer',
											'flex size-8 items-center justify-center',
											'rounded-full border transition-colors',
											'bg-neutral-0 hover:bg-primary',
											'border-neutral-300 hover:border-white',
											'text-neutral-700 hover:text-text-neutral-600'
										)}>
										<IconBasket className={'size-4'} />
									</div>
								</Link>
							</div>
						</div>

						<div className={'pt-0'}>
							<div className={cl('w-full', 'grid gap-1')}>
								{basket.tokens.map(item => (
									<BasketTokenShareLine
										key={item.address}
										address={item.address}
										symbol={item.symbol}
										share={item.share}
										chainID={basket.chainID}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

BasketsPage.AppName = 'Baskets';
BasketsPage.AppDescription = 'Just like groceries, but with tokens.';
BasketsPage.AppInfo = <DisperseAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/Baskets
 *************************************************************************************************/
BasketsPage.MetadataTitle = 'Smol Baskets - Built by MOM';
BasketsPage.MetadataDescription = 'Just like groceries, but with tokens.';
BasketsPage.MetadataURI = 'https://smold.app/apps/baskets';
BasketsPage.MetadataOG = 'https://smold.app/og.png';
BasketsPage.MetadataTitleColor = '#000000';
BasketsPage.MetadataThemeColor = '#FFD915';

export default BasketsPage;
