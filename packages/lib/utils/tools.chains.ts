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
	zkSync,
	zora
} from 'viem/chains';
import {toAddress} from '@builtbymom/web3/utils';
import {localhost} from '@builtbymom/web3/utils/wagmi';

import type {Chain} from 'viem/chains';
import type {TAddress, TNDict} from '@builtbymom/web3/types';

type TSmolChains = TNDict<
	Chain & {
		isEnabled: boolean;
		isLifiSwapSupported: boolean;
		isMultisafeSupported: boolean;
		safeAPIURI: string;
		safeUIURI: string;
		coingeckoGasCoinID: string;
		llamaChainName?: string;
		disperseAddress: TAddress;
		swapSources: {
			uniV2Router: TAddress | undefined; // https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments
			uniV3Router: TAddress | undefined; // https://docs.uniswap.org/contracts/v3/reference/deployments/
			uniV3Quoter: TAddress | undefined; // https://docs.uniswap.org/contracts/v3/reference/deployments/
			sushiV2Router: TAddress | undefined; // https://docs.sushi.com/docs/Products/Classic%20AMM/Deployment%20Addresses
			veloRouter: TAddress | undefined; // https://velodrome.finance/security#contracts
			veloPoolFactory: TAddress | undefined; // https://velodrome.finance/security#contracts
		};
	}
>;

const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);
const CHAINS: TSmolChains = {
	[mainnet.id]: {
		...mainnet,
		isEnabled: true,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-mainnet.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=eth:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
			uniV3Router: toAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
			uniV3Quoter: toAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'),
			sushiV2Router: toAddress('0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[optimism.id]: {
		...optimism,
		name: 'Optimism',
		isEnabled: true,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-optimism.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=oeth:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'optimism',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2'),
			uniV3Router: toAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
			uniV3Quoter: toAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'),
			sushiV2Router: toAddress('0x2ABf469074dc0b54d793850807E6eb5Faf2625b1'),
			veloRouter: toAddress('0xa062aE8A9c5e11aaA026fc2670B0D65cCc8B2858'),
			veloPoolFactory: toAddress('0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a')
		}
	},
	[bsc.id]: {
		...bsc,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-bsc.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=bnb:',
		coingeckoGasCoinID: 'binancecoin',
		llamaChainName: 'bsc',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'),
			uniV3Router: toAddress('0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2'),
			uniV3Quoter: toAddress('0x78D78E420Da98ad378D7799bE8f4AF69033EB077'),
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[gnosis.id]: {
		...gnosis,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-gnosis-chain.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=gno:',
		coingeckoGasCoinID: 'xdai',
		llamaChainName: 'xdai',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x1C232F01118CB8B424793ae03F870aa7D0ac7f77'), // honeyswap: https://wiki.1hive.org/projects/honeyswap/honeyswap-on-xdai
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[polygon.id]: {
		...polygon,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-polygon.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=matic:',
		coingeckoGasCoinID: 'matic-network',
		llamaChainName: 'polygon',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0xedf6066a2b290C185783862C7F4776A2C8077AD1'),
			uniV3Router: toAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
			uniV3Quoter: toAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'),
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[polygonZkEvm.id]: {
		...polygonZkEvm,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-zkevm.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zkevm:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x9B3336186a38E1b6c21955d112dbb0343Ee061eE'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[fantom.id]: {
		...fantom,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.fantom.network/home?safe=ftm:',
		coingeckoGasCoinID: 'fantom',
		llamaChainName: 'fantom',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[zkSync.id]: {
		...zkSync,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: 'https://safe-transaction-zksync.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=zksync:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[mantle.id]: {
		...mantle,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://multisig.mantle.xyz/home?safe=mantle:',
		coingeckoGasCoinID: 'mantle',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[base.id]: {
		...base,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=base:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'base',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'),
			uniV3Router: toAddress('0x2626664c2603336E57B271c5C0b26F421741e481'),
			uniV3Quoter: toAddress('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'),
			sushiV2Router: toAddress('0x6BDED42c6DA8FBf0d2bA55B2fa120C5e0c8D7891'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[sepolia.id]: {
		...sepolia,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/apps?safe=sep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: toAddress('0x425141165d3DE9FEC831896C016617a52363b687'),
			uniV3Router: toAddress('0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'),
			uniV3Quoter: toAddress('0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'),
			sushiV2Router: toAddress('0xeaBcE3E74EF41FB40024a21Cc2ee2F5dDc615791'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[baseSepolia.id]: {
		...baseSepolia,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-base-sepolia.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=basesep:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: toAddress('0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4'),
			uniV3Quoter: toAddress('0xC5290058841028F1614F3A6F0F5816cAd0df5E27'),
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[arbitrum.id]: {
		...arbitrum,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-arbitrum.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=arb1:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'arbitrum',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: toAddress('0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'),
			uniV3Router: toAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
			uniV3Quoter: toAddress('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'),
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[celo.id]: {
		...celo,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-celo.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=celo:',
		coingeckoGasCoinID: 'celo',
		llamaChainName: 'celo',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: toAddress('0x5615CDAb10dc425a742d643d949a7F474C01abc4'),
			uniV3Quoter: toAddress('0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8'),
			sushiV2Router: toAddress('0x1421bDe4B10e8dd459b3BCb598810B1337D56842'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[avalanche.id]: {
		...avalanche,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-avalanche.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=avax:',
		coingeckoGasCoinID: 'avalanche-2',
		llamaChainName: 'avax',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: toAddress('0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24'),
			uniV3Router: toAddress('0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE'),
			uniV3Quoter: toAddress('0xbe0F5544EC67e9B3b2D979aaA43f18Fd87E6257F'),
			sushiV2Router: toAddress('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[linea.id]: {
		...linea,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.linea.build/home?safe=linea:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x2ABf469074dc0b54d793850807E6eb5Faf2625b1'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[scroll.id]: {
		...scroll,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://app.safe.global/home?safe=scr:',
		coingeckoGasCoinID: 'ethereum',
		llamaChainName: 'scroll',
		disperseAddress: toAddress('0x38a9C84bAaf727F8E09deF72C4Dc224fEFf2028F'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x9B3336186a38E1b6c21955d112dbb0343Ee061eE'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[metis.id]: {
		...metis,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://metissafe.tech/home?safe=metis-andromeda:',
		coingeckoGasCoinID: 'metis-token',
		disperseAddress: toAddress('0x8137aba86f91c8E592d6A791e06D0C868DBad3C8'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0xbF3B71decBCEFABB3210B9D8f18eC22e0556f5F0'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[aurora.id]: {
		...aurora,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: 'https://safe-transaction-aurora.safe.global',
		safeUIURI: 'https://app.safe.global/home?safe=aurora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xe025e5B1c61FD98e33F02caC811469664A81b4BD'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[zora.id]: {
		...zora,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=zora:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xF7D540b9d4b94a24389802Bcf2f6f02013d08142'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[mode.id]: {
		...mode,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.optimism.io/home?safe=mode:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[fraxtal.id]: {
		...fraxtal,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://safe.mainnet.frax.com/home?safe=fraxtal:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0xC813978A4c104250B1d2bC198cC7bE74b68Cd81b'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[confluxESpace.id]: {
		...confluxESpace,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: 'https://safe.conflux123.xyz/home?safe=CFX:',
		coingeckoGasCoinID: 'conflux-token',
		disperseAddress: toAddress('0x8137aba86f91c8e592d6a791e06d0c868dbad3c8'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: undefined,
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[blast.id]: {
		...blast,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: true,
		safeAPIURI: '',
		safeUIURI: 'https://blast-safe.io/home?safe=blast:',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: toAddress('0x274889F6864Bc0493BfEe3CF292A2A0ba1A76951'),
		swapSources: {
			uniV2Router: toAddress('0x9B3336186a38E1b6c21955d112dbb0343Ee061eE'),
			uniV3Router: toAddress('0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66'),
			uniV3Quoter: toAddress('0x6Cdcd65e03c1CEc3730AeeCd45bc140D57A25C77'),
			sushiV2Router: toAddress('0x54CF3d259a06601b5bC45F61A16443ed5404DD64'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	},
	[filecoin.id]: {
		...filecoin,
		isEnabled: false,
		isLifiSwapSupported: false,
		isMultisafeSupported: false,
		safeAPIURI: '',
		safeUIURI: '',
		coingeckoGasCoinID: 'filecoin',
		llamaChainName: 'filecoin',
		disperseAddress: toAddress('0xD152f549545093347A162Dce210e7293f1452150'),
		swapSources: {
			uniV2Router: undefined,
			uniV3Router: undefined,
			uniV3Quoter: undefined,
			sushiV2Router: toAddress('0x46B3fDF7b5CDe91Ac049936bF0bDb12c5d22202e'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	}
};

if (isDev) {
	CHAINS[localhost.id] = {
		...localhost,
		isEnabled: false,
		isLifiSwapSupported: true,
		isMultisafeSupported: true,
		safeUIURI: 'https://app.safe.global/home?safe=eth:',
		safeAPIURI: 'https://safe-transaction-base.safe.global',
		coingeckoGasCoinID: 'ethereum',
		disperseAddress: zeroAddress,
		swapSources: {
			uniV2Router: toAddress('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'),
			uniV3Router: toAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'),
			uniV3Quoter: toAddress('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'),
			sushiV2Router: toAddress('0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'),
			veloRouter: undefined,
			veloPoolFactory: undefined
		}
	};
}

const supportedNetworks: Chain[] = Object.values(CHAINS).filter(e => !e.testnet && e.isEnabled);
const supportedTestNetworks: Chain[] = Object.values(CHAINS).filter(e => e.testnet && e.isEnabled);
const networks = [...supportedNetworks, ...supportedTestNetworks];

export {CHAINS, isDev, networks, supportedNetworks, supportedTestNetworks};
