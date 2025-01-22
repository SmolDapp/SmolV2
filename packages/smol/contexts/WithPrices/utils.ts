import {deepMerge} from '@lib/utils/helpers';
import {fromNormalized, toBigInt, toNormalizedBN} from '@lib/utils/numbers';
import {CHAINS} from '@lib/utils/tools.chains';
import {toAddress} from 'lib/utils/tools.addresses';

import type {TLLamaPricesEndpointResponse, TPriceTokens, TPrices, TPricesProps} from '@smolContexts/WithPrices/types';
import type {AxiosResponse} from 'axios';

export const usePricesDefaultProps: TPricesProps = {
	pricingHash: '',
	prices: {},
	getPrice: () => undefined,
	getPrices: () => ({})
};

/**************************************************************************************************
 ** The prepareQueryStringForYDaemon function will prepare the query string for the yDaemon
 ** endpoint. It will return a string containing the chainID and the token address separated by a
 ** colon.
 ************************************************************************************************/
export function prepareQueryStringForYDaemon(tokens: TPriceTokens): string {
	const allTokens = [];
	for (const token of tokens) {
		allTokens.push(`${token.chainID}:${token.address}`);
	}
	return allTokens.join(',');
}

/**************************************************************************************************
 ** The prepareQueryStringForLlama function will prepare the query string for the llama endpoint.
 ** It will return a string containing the chain name and the token address separated by a colon.
 ** If the chain doesn't have a llamaChainName, it will be ignored.
 ************************************************************************************************/
export function prepareQueryStringForLlama(tokens: TPriceTokens): string {
	const allTokens = [];
	for (const token of tokens) {
		if (!CHAINS[token.chainID]?.llamaChainName) {
			continue;
		}
		allTokens.push(`${CHAINS[token.chainID]?.llamaChainName}:${token.address}`);
	}
	return allTokens.join(',');
}

/**************************************************************************************************
 ** The mergeYDaemonResponse function will merge the responses from the ydaemon endpoint. It will
 ** return an object containing the status of the response and the values.
 ** It is used to merge multiple responses from the ydaemon endpoint.
 ************************************************************************************************/
export function mergeYDaemonResponse(allPricesFromYDaemon: PromiseSettledResult<AxiosResponse>[]): {
	status: 'fulfilled' | 'rejected';
	values: Record<number, Record<string, string>>;
} {
	const pricesFromYDaemon = allPricesFromYDaemon.reduce(
		(acc, current) => {
			if (current.status === 'fulfilled') {
				acc.value.data = deepMerge(acc.value.data, current.value.data) as Record<
					number,
					Record<string, string>
				>;
			}
			return acc;
		},
		{status: 'fulfilled', value: {data: {}}}
	);
	return {
		status: pricesFromYDaemon.status as 'fulfilled' | 'rejected',
		values: pricesFromYDaemon.value.data
	};
}

/**************************************************************************************************
 ** The mergeLlamaResponse function will merge the responses from the llama endpoint. It will return
 ** an object containing the status of the response and the values.
 ** It is used to merge multiple responses from the llama endpoint.
 ************************************************************************************************/
export function mergeLlamaResponse(allPricesFromLlama: PromiseSettledResult<AxiosResponse>[]): {
	status: 'fulfilled' | 'rejected';
	values: TLLamaPricesEndpointResponse;
} {
	const pricesFromLlama = allPricesFromLlama.reduce(
		(acc, current) => {
			if (current.status === 'fulfilled') {
				acc.value.data = deepMerge(acc.value.data, current.value.data) as TLLamaPricesEndpointResponse;
			}
			return acc;
		},
		{status: 'fulfilled', value: {data: {} as TLLamaPricesEndpointResponse}}
	);
	return {
		status: pricesFromLlama.status as 'fulfilled' | 'rejected',
		values: pricesFromLlama.value.data
	};
}

/**************************************************************************************************
 ** The assignYDaemonPrices function will assign the prices from the yDaemon endpoint to the prices
 ** object. It will return the updated prices object.
 ************************************************************************************************/
export function assignYDaemonPrices(
	pricesFromYDaemon: {
		status: 'fulfilled' | 'rejected';
		values: Record<number, Record<string, string>>;
	},
	newPrices: TPrices
): TPrices {
	if (pricesFromYDaemon.status === 'fulfilled') {
		for (const chainID in pricesFromYDaemon.values) {
			const item = pricesFromYDaemon.values[Number(chainID)];
			if (!newPrices[Number(chainID)]) {
				newPrices[Number(chainID)] = {};
			}
			for (const address in item) {
				if (toBigInt(newPrices[Number(chainID)][toAddress(address)]?.raw) === 0n) {
					newPrices[Number(chainID)][toAddress(address)] = toNormalizedBN(item[toAddress(address)] || 0, 6);
				}
			}
		}
	}
	return newPrices;
}

/**************************************************************************************************
 ** The assignLlamaPrices function will assign the prices from the llama endpoint to the prices
 ** object. It will return the updated prices object.
 ************************************************************************************************/
export function assignLlamaPrices(
	pricesFromLlama: {status: 'fulfilled' | 'rejected'; values: TLLamaPricesEndpointResponse},
	newPrices: TPrices
): TPrices {
	const storedChainsToID: Record<string, number> = {};
	if (pricesFromLlama.status === 'fulfilled' && pricesFromLlama.values) {
		const {coins} = pricesFromLlama.values;
		if (!coins) {
			return newPrices;
		}
		for (const [chainNameAndTokenAddress, details] of Object.entries(coins)) {
			const [chainName, tokenAddress] = chainNameAndTokenAddress.split(':');

			let chainID = storedChainsToID[chainName];
			if (!storedChainsToID[chainName]) {
				const chain = Object.values(CHAINS).find(chain => chain?.llamaChainName === chainName);
				if (!chain) {
					continue;
				}
				storedChainsToID[chainName] = chain.id;
				chainID = chain.id;
			}

			const normalizedPrice = toNormalizedBN(fromNormalized(details.price || 0, 6), 6);
			if (!newPrices[chainID]) {
				newPrices[chainID] = {};
			}
			newPrices[chainID][toAddress(tokenAddress)] = normalizedPrice;
		}
	}
	return newPrices;
}
