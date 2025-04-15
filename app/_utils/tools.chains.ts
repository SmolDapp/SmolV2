/* eslint-disable object-curly-newline */
'use client';

import {zeroAddress} from 'viem';
import {
	arbitrum,
	aurora,
	avalanche,
	base,
	baseSepolia,
	berachain,
	blast,
	bsc,
	celo,
	confluxESpace,
	fantom,
	filecoin,
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
	zksync,
	zora
} from 'viem/chains';

import {toAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {Chain} from 'viem';

type TSmolChains = Record<
	number,
	Chain & {
		isLifiSwapSupported: boolean;
		isMultisafeSupported: boolean;
		safeAPIURI: string;
		safeUIURI: string;
		coingeckoGasCoinID: string;
		llamaChainName?: string;
		disperseAddress: TAddress;
		yearnRouterAddress: TAddress | undefined;
	}
>;

type TAssignRPCUrls = {
	default: {
		http: string[];
	};
};
function assignRPCUrls(chain: Chain, rpcUrls?: string[]): TAssignRPCUrls {
	const availableRPCs: string[] = [];

	const newRPC = process.env.RPC_URI_FOR?.[chain.id] || '';
	const newRPCBugged = process.env[`RPC_URI_FOR_${chain.id}`];
	const oldRPC = process.env.JSON_RPC_URI?.[chain.id] || process.env.JSON_RPC_URL?.[chain.id];
	const defaultJsonRPCURL = chain?.rpcUrls?.public?.http?.[0];
	const injectedRPC = newRPC || oldRPC || newRPCBugged || defaultJsonRPCURL || '';
	if (injectedRPC) {
		availableRPCs.push(injectedRPC);
	}
	if (chain.rpcUrls['alchemy']?.http[0] && process.env.ALCHEMY_KEY) {
		availableRPCs.push(`${chain.rpcUrls['alchemy']?.http[0]}/${process.env.ALCHEMY_KEY}`);
	}
	if (chain.rpcUrls['infura']?.http[0] && process.env.INFURA_PROJECT_ID) {
		availableRPCs.push(`${chain.rpcUrls['infura']?.http[0]}/${process.env.INFURA_PROJECT_ID}`);
	}

	/**********************************************************************************************
	 ** Make sure to add a proper http object to the chain.rpcUrls.default object.
	 ********************************************************************************************/
	const http = [];
	if (rpcUrls?.length) {
		http.push(...rpcUrls);
	}
	if (injectedRPC) {
		http.push(injectedRPC);
	}
	if (availableRPCs.length) {
		http.push(...availableRPCs);
	}
	http.push(...chain.rpcUrls.default.http);
	return {
		...chain.rpcUrls,
		default: {http}
	};
}

const localhost = {
	id: 1337,
	name: 'Localhost',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH'
	},
	rpcUrls: {
		default: {http: ['http://localhost:8545', 'http://0.0.0.0:8545']},
		public: {http: ['http://localhost:8545', 'http://0.0.0.0:8545']}
	},
	contracts: {
		ensRegistry: {
			address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
		},
		ensUniversalResolver: {
			address: '0xE4Acdd618deED4e6d2f03b9bf62dc6118FC9A4da',
			blockCreated: 16773775
		},
		multicall3: {
			address: '0xca11bde05977b3631167028862be2a173976ca11',
			blockCreated: 14353601
		}
	}
} as const satisfies Chain;

const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);
const CHAINS: TSmolChains = {
	[mainnet.id]: {
		...mainnet,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-mainnet.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=eth:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(mainnet)
	},
	[optimism.id]: {
		...optimism,
		name: 'Optimism',
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-optimism.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=oeth:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'optimism',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(optimism)
	},
	[bsc.id]: {
		...bsc,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-bsc.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=bnb:',
		coingeckoGasCoinID: 'binancecoin',
		llamaChainName: 'bsc',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(bsc)
	},
	[gnosis.id]: {
		...gnosis,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-gnosis-chain.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=gno:',
		coingeckoGasCoinID: 'xdai',
		llamaChainName: 'xdai',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(gnosis)
	},
	[polygon.id]: {
		...polygon,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-polygon.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=matic:',
		coingeckoGasCoinID: 'matic-network',
		llamaChainName: 'polygon',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(polygon)
	},
	[polygonZkEvm.id]: {
		...polygonZkEvm,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-zkevm.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zkevm:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(polygonZkEvm)
	},
	[fantom.id]: {
		...fantom,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.fantom.network/home?safe=ftm:',
		coingeckoGasCoinID: 'fantom',
		llamaChainName: 'fantom',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(fantom)
	},
	[zksync.id]: {
		...zksync,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: 'https://safe-transaction-zksync.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zksync:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(zksync)
	},
	[mantle.id]: {
		...mantle,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://multisig.mantle.xyz/home?safe=mantle:',
		coingeckoGasCoinID: 'mantle',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(mantle)
	},
	[base.id]: {
		...base,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=base:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'base',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(base)
	},
	[sepolia.id]: {
		...sepolia,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/apps?safe=sep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(sepolia)
	},
	[baseSepolia.id]: {
		...baseSepolia,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=basesep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(baseSepolia)
	},
	[arbitrum.id]: {
		...arbitrum,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-arbitrum.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=arb1:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'arbitrum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: toAddress('0x1112dbcf805682e828606f74ab717abf4b4fd8de'),
		rpcUrls: assignRPCUrls(arbitrum)
	},
	[celo.id]: {
		...celo,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-celo.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=celo:',
		coingeckoGasCoinID: 'celo',
		llamaChainName: 'celo',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(celo)
	},
	[avalanche.id]: {
		...avalanche,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-avalanche.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=avax:',
		coingeckoGasCoinID: 'avalanche-2',
		llamaChainName: 'avax',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(avalanche)
	},
	[linea.id]: {
		...linea,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.linea.build/home?safe=linea:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(linea)
	},
	[scroll.id]: {
		...scroll,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://app.safe.global/home?safe=scr:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'scroll',
		disperseAddress: toAddress('0x38a9C84bAaf727F8E09deF72C4Dc224fEFf2028F'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(scroll)
	},
	[metis.id]: {
		...metis,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://metissafe.tech/home?safe=metis-andromeda:',
		coingeckoGasCoinID: 'metis-token',
		disperseAddress: toAddress('0x8137aba86f91c8E592d6A791e06D0C868DBad3C8'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(metis)
	},
	[aurora.id]: {
		...aurora,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-aurora.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=aurora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(aurora)
	},
	[zora.id]: {
		...zora,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=zora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xF7D540b9d4b94a24389802Bcf2f6f02013d08142'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(zora)
	},
	[mode.id]: {
		...mode,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=mode:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(mode)
	},
	[fraxtal.id]: {
		...fraxtal,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.mainnet.frax.com/home?safe=fraxtal:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(fraxtal)
	},
	[confluxESpace.id]: {
		...confluxESpace,
		isLifiSwapSupported: false,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://safe.conflux123.xyz/home?safe=CFX:',
		coingeckoGasCoinID: 'conflux-token',
		disperseAddress: toAddress('0x8137aba86f91c8e592d6a791e06d0c868dbad3c8'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(confluxESpace)
	},
	[blast.id]: {
		...blast,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://blast-safe.io/home?safe=blast:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0x274889F6864Bc0493BfEe3CF292A2A0ba1A76951'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(blast)
	},
	[filecoin.id]: {
		...filecoin,
		isLifiSwapSupported: false,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: '',
		coingeckoGasCoinID: 'filecoin',
		llamaChainName: 'filecoin',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(filecoin)
	},
	[berachain.id]: {
		...berachain,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-berachain.safe.global',
		safeUIURI: 'https://safe.berachain.com/home?safe=berachain:',
		coingeckoGasCoinID: 'berachain-bera',
		llamaChainName: 'bera',
		disperseAddress: toAddress('0x9c981Fa0FfF6dE9AC193FE4224e499445C814Bc4'),
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(berachain)
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
		disperseAddress: zeroAddress,
		yearnRouterAddress: undefined,
		rpcUrls: assignRPCUrls(localhost, ['http://localhost:8545'])
	};
}

const supportedNetworks: Chain[] = Object.values(CHAINS).filter(e => !e.testnet);
const supportedTestNetworks: Chain[] = Object.values(CHAINS).filter(e => e.testnet);
const networks: Chain[] = [...supportedNetworks, ...supportedTestNetworks];

export {CHAINS, networks, supportedNetworks};
