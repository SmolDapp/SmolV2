'use client';

import {toAddress} from '@builtbymom/web3/utils';

import type {TNDict} from '@builtbymom/web3/types';

export const MATIC_TOKEN_ADDRESS = toAddress('0x0000000000000000000000000000000000001010');
export const POLYGON_LENS_ADDRESS = toAddress('0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d');
export const ETHEREUM_ENS_ADDRESS = toAddress('0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85');
export const HEADER_HEIGHT = 64;

export const SUPPORTED_CHAIN_IDS: TNDict<string> = {
	1: 'Ethereum',
	10: 'Optimism',
	56: 'Binance Smart Chain',
	100: 'Gnosis',
	137: 'Polygon',
	// 250: 'Fantom',
	324: 'zkSync',
	1101: 'Polygon ZKEVM',
	8453: 'Base',
	42161: 'Arbitrum',
	43114: 'Avalanche'
};

export const SAFE_API_URI: {[chainId: number]: string} = {
	1: 'https://safe-transaction-mainnet.safe.global',
	5: 'https://safe-transaction-goerli.safe.global',
	10: 'https://safe-transaction-optimism.safe.global',
	56: 'https://safe-transaction-bsc.safe.global',
	100: 'https://safe-transaction-gnosis-chain.safe.global',
	137: 'https://safe-transaction-polygon.safe.global',
	324: 'https://safe-transaction-zksync.safe.global',
	8453: 'https://safe-transaction-base.safe.global',
	84531: 'https://safe-transaction-base.safe.global',
	42161: 'https://safe-transaction-arbitrum.safe.global'
};

export const COINGECKO_GAS_COIN_IDS: TNDict<string> = {
	1: 'ethereum',
	10: 'ethereum',
	56: 'binancecoin',
	100: 'xdai',
	137: 'matic-network',
	250: 'fantom',
	324: 'ethereum',
	8453: 'ethereum',
	42161: 'ethereum'
};
