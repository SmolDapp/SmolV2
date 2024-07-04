import React, {useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {getNewInputToken} from '../../components/Swap/useSwapFlow.lifi';
import {WalletAppInfo} from '../../components/Wallet/AppInfo';

import type {TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
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
			chainID: 1,
			decimals: 18,
			logoURI: 'https://assets.smold.app/api/token/1/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/logo-128.png',
			name: 'Ethereum',
			symbol: 'ETH',
			value: 0
		}
	});
	const [toTokens, set_toTokens] = useState<TBasketToken[]>([
		{
			...getNewInputToken(),
			share: 33,
			token: {
				address: toAddress('0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e/logo-128.png`,
				name: 'yearn.finance',
				symbol: 'YFI',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 33,
			token: {
				address: toAddress('0x9a96ec9b57fb64fbc60b423d1f4da7691bd35079'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0x9a96ec9b57fb64fbc60b423d1f4da7691bd35079/logo-128.png`,
				name: 'Ajna',
				symbol: 'AJNA',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 20,
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
			share: 14,
			token: {
				address: toAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 6,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo-128.png`,
				name: 'USD Coin',
				symbol: 'USDC',
				value: 0
			}
		}
	]);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<BasketHeader toTokens={toTokens} />

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
