import React, {useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket, type TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {FeeAmount} from '@uniswap/v3-sdk';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {getNewInputToken} from '../../components/Swap/useSwapFlow.lifi';
import {WalletAppInfo} from '../../components/Wallet/AppInfo';

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
			chainID: 100,
			decimals: 18,
			logoURI: 'https://assets.smold.app/api/token/100/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/logo-128.png',
			name: 'xDAI',
			symbol: 'xDAI',
			value: 0
		}
	});
	const [toTokens, set_toTokens] = useState<TBasketToken[]>([
		{
			...getNewInputToken(),
			share: 40,
			feeAmount: FeeAmount.LOWEST,
			token: {
				address: toAddress('0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'),
				balance: zeroNormalizedBN,
				chainID: 100,
				decimals: 6,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/100/0xddafbb505ad214d7b80b1f830fccc89b60fb7a83/logo-128.png`,
				name: 'USD Coin',
				symbol: 'USDC',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 60,
			feeAmount: FeeAmount.LOWEST,
			token: {
				address: toAddress('0xaf204776c7245bF4147c2612BF6e5972Ee483701'),
				balance: zeroNormalizedBN,
				chainID: 100,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/100/0xaf204776c7245bF4147c2612BF6e5972Ee483701/logo-128.png`,
				name: 'Sexy DAI',
				symbol: 'sDAI',
				value: 0
			}
		}
	]);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<BasketHeader
				toTokens={toTokens}
				title={'The Gnocu'}
				description={'sDAI is your savings, and the rest is to buy beers'}
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
