import React, {useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket, type TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {getNewInputToken} from '../../../components/Swap/useSwapFlow.lifi';

import type {ReactElement} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

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

export default function Basket(): ReactElement {
	const [fromToken, set_fromToken] = useState<TTokenAmountInputElement>({
		amount: '0',
		normalizedBigAmount: zeroNormalizedBN,
		status: 'none',
		isValid: true,
		UUID: 'FROM',
		token: {
			address: ETH_TOKEN_ADDRESS,
			balance: {raw: 0n, normalized: 0, display: '0'},
			chainID: 42161,
			decimals: 18,
			logoURI: 'https://assets.smold.app/api/token/10/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/logo-128.png',
			name: 'Ether',
			symbol: 'ETH',
			value: 0
		}
	});
	const [toTokens, set_toTokens] = useState<TBasketToken[]>([
		{
			...getNewInputToken(),
			share: 30,
			token: {
				address: toAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
				balance: zeroNormalizedBN,
				chainID: 42161,
				decimals: 6,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/42161/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo-128.png`,
				name: 'USDC',
				symbol: 'USDC',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 20,
			token: {
				address: toAddress('0x5979D7b546E38E414F7E9822514be443A4800529'),
				balance: zeroNormalizedBN,
				chainID: 42161,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/42161/0x5979D7b546E38E414F7E9822514be443A4800529/logo-128.png`,
				name: 'wstETH',
				symbol: 'wstETH',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 40,
			token: {
				address: toAddress('0x912CE59144191C1204E64559FE8253a0e49E6548'),
				balance: zeroNormalizedBN,
				chainID: 42161,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/42161/0x912CE59144191C1204E64559FE8253a0e49E6548/logo-128.png`,
				name: 'ARB',
				symbol: 'ARB',
				value: 0
			}
		}
	]);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<BasketHeader
				title={'Arb Chads'}
				description={'A mix of two strongest assets in our space and arbitrum'}
				toTokens={toTokens}
			/>

			<div className={'pt-6'}>
				<BalancesCurtainContextApp>
					<SwapBasket
						toTokens={toTokens}
						fromToken={fromToken}
						set_toTokens={set_toTokens}
						set_fromToken={set_fromToken}
					/>
				</BalancesCurtainContextApp>
			</div>
		</div>
	);
}

Basket.AppName = '';
Basket.AppDescription = '';

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
