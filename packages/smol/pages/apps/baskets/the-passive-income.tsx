import React, {useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {getNewInputToken} from '../../../components/Swap/useSwapFlow.lifi';
import {WalletAppInfo} from '../../../components/Wallet/AppInfo';

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
			share: 80,
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
		},
		{
			...getNewInputToken(),
			share: 20,
			token: {
				address: toAddress('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'),
				balance: zeroNormalizedBN,
				chainID: 1,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/1/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo-128.png`,
				name: 'Staking ETH',
				symbol: 'stETH',
				value: 0
			}
		}
	]);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<BasketHeader
				title={'The Stable Boy'}
				description={'Everything is stable'}
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
