/* eslint-disable object-curly-newline */
'use client';

import {zeroAddress} from 'viem';
import {
	arbitrum,
	aurora,
	avalanche,
	base,
	baseSepolia,
	blast,
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
	sepolia,
	zkSync,
	zora
} from 'viem/chains';
import {toAddress} from '@builtbymom/web3/utils';
import {localhost} from '@builtbymom/web3/utils/wagmi';

import type {Chain} from 'viem/chains';
import type {TAddress, TNDict} from '@builtbymom/web3/types';

type TSmolChains = TNDict<
	Chain & {
		isLifiSwapSupported: boolean;
		isMultisafeSupported: boolean;
		safeAPIURI: string;
		safeUIURI: string;
		coingeckoGasCoinID: string;
		disperseAddress: TAddress;
	}
>;

const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);
const CHAINS: TSmolChains = {
	[mainnet.id]: {
		...mainnet,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-mainnet.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=eth:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[optimism.id]: {
		...optimism,
		name: 'Optimism',
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-optimism.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=oeth:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[bsc.id]: {
		...bsc,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-bsc.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=bnb:',
		coingeckoGasCoinID: 'binancecoin',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[gnosis.id]: {
		...gnosis,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-gnosis-chain.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=gno:',
		coingeckoGasCoinID: 'xdai',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[polygon.id]: {
		...polygon,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-polygon.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=matic:',
		coingeckoGasCoinID: 'matic-network',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[polygonZkEvm.id]: {
		...polygonZkEvm,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-zkevm.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zkevm:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[fantom.id]: {
		...fantom,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.fantom.network/home?safe=ftm:',
		coingeckoGasCoinID: 'fantom',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[zkSync.id]: {
		...zkSync,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: 'https://safe-transaction-zksync.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zksync:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[mantle.id]: {
		...mantle,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://multisig.mantle.xyz/home?safe=mantle:',
		coingeckoGasCoinID: 'mantle',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[base.id]: {
		...base,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=base:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[sepolia.id]: {
		...sepolia,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/apps?safe=sep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[baseSepolia.id]: {
		...baseSepolia,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=basesep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[arbitrum.id]: {
		...arbitrum,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-arbitrum.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=arb1:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[celo.id]: {
		...celo,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-celo.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=celo:',
		coingeckoGasCoinID: 'celo',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150')
	},
	[avalanche.id]: {
		...avalanche,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-avalanche.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=avax:',
		coingeckoGasCoinID: 'avalanche-2',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[linea.id]: {
		...linea,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.linea.build/home?safe=linea:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD')
	},
	[scroll.id]: {
		...scroll,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://app.safe.global/home?safe=scr:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0x38a9C84bAaf727F8E09deF72C4Dc224fEFf2028F')
	},
	[metis.id]: {
		...metis,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://metissafe.tech/home?safe=metis-andromeda:',
		coingeckoGasCoinID: 'metis-token',
		disperseAddress: toAddress('0x8137aba86f91c8E592d6A791e06D0C868DBad3C8')
	},
	[aurora.id]: {
		...aurora,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-aurora.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=aurora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD')
	},
	[zora.id]: {
		...zora,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=zora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xF7D540b9d4b94a24389802Bcf2f6f02013d08142')
	},
	[mode.id]: {
		...mode,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=mode:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[fraxtal.id]: {
		...fraxtal,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.mainnet.frax.com/home?safe=fraxtal:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b')
	},
	[confluxESpace.id]: {
		...confluxESpace,
		isLifiSwapSupported: false,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://safe.conflux123.xyz/home?safe=CFX:',
		coingeckoGasCoinID: 'conflux-token',
		disperseAddress: toAddress('0x8137aba86f91c8e592d6a791e06d0c868dbad3c8')
	},
	[blast.id]: {
		...blast,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://blast-safe.io/home?safe=blast:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0x274889F6864Bc0493BfEe3CF292A2A0ba1A76951')
	}
};

if (isDev) {
	CHAINS[localhost.id] = {
		...localhost,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeUIURI: 'https://app.safe.global/home?safe=eth:',
		safeAPIURI: 'https://safe-transaction-base.safe.global',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: zeroAddress
	};
}

const supportedNetworks: Chain[] = Object.values(CHAINS).filter(e => !e.testnet);
const supportedTestNetworks: Chain[] = Object.values(CHAINS).filter(e => e.testnet);

export {CHAINS, supportedNetworks, supportedTestNetworks};
