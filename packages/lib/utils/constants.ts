'use client';

import {
	arbitrum,
	aurora,
	avalanche,
	base,
	baseGoerli,
	bsc,
	celo,
	confluxESpace,
	fantom,
	fraxtal,
	gnosis,
	linea,
	mainnet,
	mantle,
	metis,
	mode,
	optimism,
	polygon,
	polygonZkEvm,
	scroll,
	zkSync,
	zora
} from 'viem/chains';
import {toAddress} from '@builtbymom/web3/utils';

import type {TAddress, TNDict} from '@builtbymom/web3/types';

export const SAFE_API_URI: {[chainId: number]: string} = {
	[mainnet.id]: 'https://safe-transaction-mainnet.safe.global',
	[optimism.id]: 'https://safe-transaction-optimism.safe.global',
	[bsc.id]: 'https://safe-transaction-bsc.safe.global',
	[gnosis.id]: 'https://safe-transaction-gnosis-chain.safe.global',
	[polygon.id]: 'https://safe-transaction-polygon.safe.global',
	[polygonZkEvm.id]: 'https://app.safe.global/home?safe=zkevm:',
	[fantom.id]: 'https://safe.fantom.network/home?safe=ftm:',
	[zkSync.id]: 'https://safe-transaction-zksync.safe.global',
	[mantle.id]: 'https://multisig.mantle.xyz/home?safe=mantle:',
	[base.id]: 'https://safe-transaction-base.safe.global',
	[baseGoerli.id]: 'https://safe-transaction-base.safe.global',
	[arbitrum.id]: 'https://safe-transaction-arbitrum.safe.global',
	[celo.id]: 'https://app.safe.global/home?safe=celo:',
	[avalanche.id]: 'https://app.safe.global/home?safe=avax:',
	[linea.id]: 'https://safe.linea.build/home?safe=linea:',
	[scroll.id]: 'https://safe.scroll.xyz/home?safe=scr:',
	[aurora.id]: 'https://app.safe.global/home?safe=aurora:',
	[zora.id]: 'https://safe.optimism.io/home?safe=zora:',
	[mode.id]: 'https://safe.optimism.io/home?safe=mode:',
	[fraxtal.id]: 'https://safe.mainnet.frax.com/home?safe=fraxtal:'
};

export const COINGECKO_GAS_COIN_IDS: TNDict<string> = {
	[mainnet.id]: 'ethereum',
	[optimism.id]: 'ethereum',
	[bsc.id]: 'binancecoin',
	[gnosis.id]: 'xdai',
	[polygon.id]: 'matic-network',
	[polygonZkEvm.id]: 'ethereum',
	[fantom.id]: 'fantom',
	[zkSync.id]: 'ethereum',
	[mantle.id]: 'mantle',
	[baseGoerli.id]: 'ethereum',
	[base.id]: 'ethereum',
	[arbitrum.id]: 'ethereum',
	[celo.id]: 'celo',
	[avalanche.id]: 'avalanche-2',
	[linea.id]: 'ethereum',
	[scroll.id]: 'ethereum',
	[aurora.id]: 'ethereum',
	[zora.id]: 'ethereum',
	[mode.id]: 'ethereum',
	[fraxtal.id]: 'ethereum'
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
	[linea.id]: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
	[scroll.id]: toAddress('0x38a9C84bAaf727F8E09deF72C4Dc224fEFf2028F'),
	[aurora.id]: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
	[confluxESpace.id]: toAddress('0x8137aba86f91c8e592d6a791e06d0c868dbad3c8'),
	[metis.id]: toAddress('0x8137aba86f91c8E592d6A791e06D0C868DBad3C8'),
	[zora.id]: toAddress('0xF7D540b9d4b94a24389802Bcf2f6f02013d08142'),
	[avalanche.id]: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
	[mode.id]: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
	[fraxtal.id]: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
};

export const SUPPORTED_MULTICHAINS = [
	mainnet,
	optimism,
	bsc,
	gnosis,
	polygon,
	polygonZkEvm,
	fantom,
	zkSync,
	mantle,
	base,
	baseGoerli, //Testnet
	arbitrum,
	celo,
	avalanche,
	linea,
	scroll,
	aurora,
	zora,
	fraxtal,
	mode
];

export const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);
