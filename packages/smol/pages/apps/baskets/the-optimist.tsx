import React, {useEffect, useState} from 'react';
import {BasketHeader} from 'packages/smol/components/Basket/BasketHeader';
import {SwapBasket, type TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
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
			chainID: 10,
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
			share: 40,
			token: {
				address: toAddress('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'),
				balance: zeroNormalizedBN,
				chainID: 10,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/10/0xda10009cbd5d07dd0cecc66161fc93d7c9000da1/logo-128.png`,
				name: 'DAI',
				symbol: 'DAI',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 50,
			token: {
				address: toAddress('0x4200000000000000000000000000000000000042'),
				balance: zeroNormalizedBN,
				chainID: 10,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/10/0x4200000000000000000000000000000000000042/logo-128.png`,
				name: 'Optimism',
				symbol: 'OP',
				value: 0
			}
		},
		{
			...getNewInputToken(),
			share: 10,
			token: {
				address: toAddress('0x9560e827af36c94d2ac33a39bce1fe78631088db'),
				balance: zeroNormalizedBN,
				chainID: 10,
				decimals: 18,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/10/0x9560e827af36c94d2ac33a39bce1fe78631088db/logo-128.png`,
				name: 'Velodrome',
				symbol: 'VELO',
				value: 0
			}
		}
	]);

	useEffect(() => {
		console.log(getNetwork(10));
	}, []);

	return (
		<div className={'grid max-w-screen-sm gap-4'}>
			<BasketHeader
				title={'The Optimist'}
				description={'Be optimistic, get fancy tokens'}
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
