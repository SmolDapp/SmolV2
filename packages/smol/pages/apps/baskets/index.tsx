import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ColoredRatioBar} from 'packages/smol/components/Basket/ColoredRatioBar';
import {DisperseAppInfo} from 'packages/smol/components/Disperse/AppInfo';
import {cl, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {IconBasket} from '@lib/icons/IconBasket';

import type {ReactElement} from 'react';

const baskets = {
	1: {
		ID: 1,
		slug: 'the-stable-boy',
		name: 'The Stable Boy',
		chainID: 1,
		tokens: [
			{
				address: toAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
				share: 34,
				symbol: 'DAI'
			},
			{
				address: toAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
				share: 33,
				symbol: 'USDC'
			},
			{
				address: toAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
				share: 33,
				symbol: 'USDT'
			}
		]
	},
	2: {
		ID: 1,
		slug: 'the-optimist',
		name: 'The Optimist',
		chainID: 10,
		tokens: [
			{
				address: toAddress('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'),
				share: 40,
				symbol: 'DAI'
			},
			{
				address: toAddress('0x4200000000000000000000000000000000000042'),
				share: 50,
				symbol: 'OP'
			},
			{
				address: toAddress('0x9560e827af36c94d2ac33a39bce1fe78631088db'),
				share: 10,
				symbol: 'Velo'
			}
		]
	},
	3: {
		ID: 2,
		slug: 'the-passive-income',
		name: 'The Passive Income',
		chainID: 1,
		tokens: [
			{
				address: toAddress('0x83F20F44975D03b1b09e64809B757c47f942BEeA'),
				share: 80,
				symbol: 'sDAI'
			},
			{
				address: toAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
				share: 20,
				symbol: 'stETH'
			}
		]
	}
};

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
									<div
										key={item.address}
										className={cl('flex flex-col items-center', index === 0 ? '' : '-ml-5')}>
										<div className={'size-10 rounded-full border border-neutral-200'}>
											<Image
												src={`${process.env.SMOL_ASSETS_URL}/token/${basket.chainID}/${item.address}/logo-128.png`}
												alt={''}
												width={40}
												height={40}
											/>
										</div>
									</div>
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
									<div
										key={item.address}
										className={'group flex w-full cursor-help items-center justify-center gap-2'}>
										<p className={'w-16 text-sm text-neutral-600'}>{item.symbol}</p>
										<div className={'relative h-4 w-full'}>
											<ColoredRatioBar
												key={item.address}
												logoURI={`${process.env.SMOL_ASSETS_URL}/token/${basket.chainID}/${item.address}/logo-128.png`}
												share={item.share}
											/>
										</div>
										<p
											className={
												'text-xs text-neutral-900 opacity-20 transition-opacity duration-500 group-hover:opacity-100'
											}>
											{`(${item.share}%)`}
										</p>
									</div>
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
