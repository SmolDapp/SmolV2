'use client';

import {
	arbitrum,
	aurora,
	avalanche,
	base,
	bsc,
	celo,
	confluxESpace,
	fantom,
	gnosis,
	linea,
	mainnet,
	mantle,
	metis,
	optimism,
	polygon,
	polygonZkEvm,
	scroll,
	zkSync
} from 'viem/chains';
import {toAddress} from '@builtbymom/web3/utils';

import type {TAddress, TNDict} from '@builtbymom/web3/types';

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
	43114: 'Avalanche',
	1030: 'Conflux',
	1088: 'Metis'
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

export const DISPERSE_CONTRACT_PER_CHAIN: TNDict<TAddress> = {
	[mainnet.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[optimism.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[bsc.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[gnosis.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[polygon.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[fantom.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[zkSync.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[polygonZkEvm.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[mantle.id]: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
	[base.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[arbitrum.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[celo.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[avalanche.id]: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
	[linea.id]: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
	[scroll.id]: toAddress('0x38a9C84bAaf727F8E09deF72C4Dc224fEFf2028F'),
	[aurora.id]: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
	[confluxESpace.id]: toAddress('0x8137aba86f91c8e592d6a791e06d0c868dbad3c8'),
	[metis.id]: toAddress('0x8137aba86f91c8E592d6A791e06D0C868DBad3C8')
};
