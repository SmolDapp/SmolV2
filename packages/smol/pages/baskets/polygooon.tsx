import React, {useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket, type TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
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
			chainID: 137,
			decimals: 18,
			logoURI: 'https://assets.smold.app/api/token/137/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee/logo-128.png',
			name: 'Matic',
			symbol: 'MATIC',
			value: 0
		}
	});
	const [toTokens, set_toTokens] = useState<TBasketToken[]>([
		{
			...getNewInputToken(),
			share: 40,
			token: {
				address: toAddress('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
				balance: zeroNormalizedBN,
				chainID: 137,
				decimals: 6,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/137/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo-128.png`,
				name: 'Tether USD',
				symbol: 'USDT',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 60,
			token: {
				address: toAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
				balance: zeroNormalizedBN,
				chainID: 137,
				decimals: 6,
				logoURI:
					'https://raw.githubusercontent.com/SmolDapp/tokenAssets/main/tokens/137/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359/logo-128.png',
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
