import {
	arbitrum,
	base,
	baseGoerli,
	bsc,
	confluxESpace,
	fantom,
	gnosis,
	goerli,
	mainnet,
	optimism,
	polygon,
	polygonZkEvm,
	zkSync
} from 'wagmi/chains';
import {indexedWagmiChains} from '@builtbymom/web3/utils/wagmi';

import {COINGECKO_GAS_COIN_IDS, SAFE_API_URI} from './constants';

import type {Chain} from 'wagmi/chains';
import type {TChainContract, TExtendedChain} from '@builtbymom/web3/utils/wagmi';

export const supportedNetworks: Chain[] = [
	mainnet,
	{...optimism, name: 'Optimism'},
	bsc,
	gnosis,
	polygon,
	polygonZkEvm,
	fantom,
	zkSync,
	base,
	arbitrum,
	confluxESpace
];
export const supportedTestNetworks: Chain[] = [goerli, baseGoerli];

export type TAppExtendedChain = TExtendedChain & {
	safeApiUri?: string;
	coingeckoGasCoinID: string;
	contracts: {
		nftMigratooorContract?: TChainContract;
	};
};
for (const chain of Object.values(indexedWagmiChains)) {
	if (!chain || typeof chain !== 'object' || !chain.id) {
		continue;
	}
	const extendedChain = chain as TAppExtendedChain;
	extendedChain.contracts = {
		...chain.contracts
	};
	extendedChain.safeApiUri = SAFE_API_URI?.[chain.id] || '';
	extendedChain.coingeckoGasCoinID = COINGECKO_GAS_COIN_IDS?.[chain.id] || 'ethereum';
}
