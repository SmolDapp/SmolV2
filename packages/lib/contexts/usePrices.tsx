import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {serialize} from 'wagmi';
import axios from 'axios';
import {deepMerge, fromNormalized, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {useDeepCompareEffect} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {CHAINS} from '@lib/utils/tools.chains';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddress, TDict, TNDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';

type TPricesProps = {
	pricingHash: string;
	prices: TNDict<TDict<TNormalizedBN>>;
	getPrice: (value: {chainID: number; address: TAddress}) => TNormalizedBN | undefined;
	getPrices: (tokens: TToken[], chainID: number) => TDict<TNormalizedBN>;
};

const defaultProps: TPricesProps = {
	pricingHash: '',
	prices: {},
	getPrice: () => undefined,
	getPrices: () => ({})
};

function prepareQueryStringForYDaemon(tokens: Pick<TToken, 'address' | 'chainID'>[]): string {
	const allTokens = [];
	for (const token of tokens) {
		allTokens.push(`${token.chainID}:${token.address}`);
	}
	return allTokens.join(',');
}

function prepareQueryStringForLlama(tokens: Pick<TToken, 'address' | 'chainID'>[]): string {
	const allTokens = [];
	for (const token of tokens) {
		if (!CHAINS[token.chainID].llamaChainName) {
			continue;
		}
		allTokens.push(`${CHAINS[token.chainID].llamaChainName}:${token.address}`);
	}
	return allTokens.join(',');
}

const PricesContext = createContext<TPricesProps>(defaultProps);
export const WithPrices = ({children}: {children: ReactElement}): ReactElement => {
	const [pricesFromList, set_pricesFromList] = useState<TNDict<TDict<TNormalizedBN>>>({});
	const [prices, set_prices] = useState<TNDict<TDict<TNormalizedBN>>>({});
	const {listAllTokensWithBalance, listTokensWithBalance, isLoadingOnCurrentChain, isLoading} =
		useTokensWithBalance();

	/**********************************************************************************************
	 ** We will need to fetch token to an external endpoint, and we don't want to trigger a fetch
	 ** every second because a new token is added to the list.
	 ** To prevent that, but still have some reactivity on startup, we will use a useMemo hook to
	 ** create a list of tokens to use.
	 ** This will wait for the tokens for the current chain to be loaded before fetching the prices
	 ** only for theses tokens.
	 ** Then, once every other tokens are loaded, we will fetch the prices for all tokens.
	 *********************************************************************************************/
	const tokensToUse = useMemo((): Pick<TToken, 'address' | 'chainID'>[] => {
		const tokens = listAllTokensWithBalance();
		const tokensForThisChain = listTokensWithBalance();
		if (!tokens.length) {
			return [];
		}
		if (!isLoadingOnCurrentChain && isLoading && tokensForThisChain.length) {
			return tokensForThisChain;
		}
		if (isLoading) {
			return [];
		}
		return tokens;
	}, [isLoading, isLoadingOnCurrentChain, listAllTokensWithBalance, listTokensWithBalance]);

	/**********************************************************************************************
	 ** This function will fetch the prices for the tokens we want to use on the different
	 ** endpoints available. A priority is given to the llama endpoint, and if the llama endpoint
	 ** doesn't have the price, we will use the prices from the yDaemon endpoint.
	 *********************************************************************************************/
	const fetchLists = useCallback(
		async (
			_tokensToUse: Pick<TToken, 'address' | 'chainID'>[],
			dispatcher: Dispatch<SetStateAction<TNDict<TDict<TNormalizedBN>>>>
		) => {
			const queryStringForYDaemon = prepareQueryStringForYDaemon(_tokensToUse);
			const queryStringForLlama = prepareQueryStringForLlama(_tokensToUse);
			if (!queryStringForYDaemon || !queryStringForLlama) {
				return;
			}

			console.log(queryStringForYDaemon, queryStringForLlama);
			const llamaRequests = [];
			if (_tokensToUse.length > 100) {
				// As llama is a query string, we need to split it in multiple requests
				const tokens = _tokensToUse.slice();
				while (tokens.length) {
					const chunk = tokens.splice(0, 100);
					llamaRequests.push(
						axios.get(`https://coins.llama.fi/prices/current/${prepareQueryStringForLlama(chunk)}`)
					);
				}
			} else {
				llamaRequests.push(axios.get(`https://coins.llama.fi/prices/current/${queryStringForLlama}`));
			}

			const [pricesFromYDaemon, ...allPricesFromLlama] = await Promise.allSettled([
				axios.post('https://ydaemon.yearn.fi/prices/some', {addresses: queryStringForYDaemon}),
				// axios.get(`https://coins.llama.fi/prices/current/${queryStringForLlama}`)
				...llamaRequests
			]);

			const pricesFromLlama = allPricesFromLlama.reduce(
				(acc, current) => {
					if (current.status === 'fulfilled') {
						acc.value.data = deepMerge(acc.value.data, current.value.data) as unknown as {coin: unknown};
					}
					return acc;
				},
				{status: 'fulfilled', value: {data: {}}}
			);
			console.log(allPricesFromLlama, pricesFromLlama);

			console.log('UPDATING PRICES');

			dispatcher(previous => {
				const newPrices: typeof previous = {};
				for (const chainID in previous) {
					newPrices[chainID] = {...previous[chainID]};
				}
				const storedChainsToID: TDict<number> = {};
				if (pricesFromLlama.status === 'fulfilled' && (pricesFromLlama.value.data as {coins: unknown})?.coins) {
					const coins = (pricesFromLlama.value.data as {coins: unknown}).coins as TDict<{
						decimals: number;
						price: string;
					}>;

					for (const [chainNameAndTokenAddress, details] of Object.entries(coins)) {
						const [chainName, tokenAddress] = chainNameAndTokenAddress.split(':');

						let chainID = storedChainsToID[chainName];
						if (!storedChainsToID[chainName]) {
							const chain = Object.values(CHAINS).find(chain => chain.llamaChainName === chainName);
							if (!chain) {
								continue;
							}
							storedChainsToID[chainName] = chain.id;
							chainID = chain.id;
						}
						if (chainID === 0) {
							console.log(chainNameAndTokenAddress, details, chainName);
						}

						const normalizedPrice = toNormalizedBN(fromNormalized(details.price || 0, 6), 6);
						if (!newPrices[chainID]) {
							newPrices[chainID] = {};
						}
						newPrices[chainID][tokenAddress] = normalizedPrice;
					}
				}

				if (pricesFromYDaemon.status === 'fulfilled') {
					for (const chainID in pricesFromYDaemon.value.data) {
						const item = pricesFromYDaemon.value.data[Number(chainID)];
						if (!newPrices[Number(chainID)]) {
							newPrices[Number(chainID)] = {};
						}
						for (const address in item) {
							if (toBigInt(newPrices[Number(chainID)][toAddress(address)]?.raw) === 0n) {
								newPrices[Number(chainID)][toAddress(address)] = toNormalizedBN(
									item[toAddress(address)] || 0,
									6
								);
							}
						}
					}
				}

				return newPrices;
			});
		},
		[]
	);

	/**********************************************************************************************
	 ** We want to trigger the fetchLists function when the tokensToUse changes.
	 *********************************************************************************************/
	useDeepCompareEffect(() => {
		fetchLists(tokensToUse, set_pricesFromList);
	}, [tokensToUse]);

	/**********************************************************************************************
	 ** This function will be used to get the price of a given token on a given chain.
	 *********************************************************************************************/
	const getPrice = useCallback(
		({chainID, address}: {chainID: number; address: TAddress}): TNormalizedBN | undefined => {
			const tokenExists = prices[chainID]?.[toAddress(address)] || pricesFromList[chainID]?.[toAddress(address)];
			const tokenPrice =
				prices[chainID]?.[toAddress(address)] || pricesFromList[chainID]?.[toAddress(address)] || undefined;

			if (!tokenExists) {
				fetchLists([{chainID, address: toAddress(address)}], set_prices);
			}
			return tokenPrice;
		},
		[fetchLists, prices, pricesFromList]
	);

	const getPrices = useCallback(
		(tokens: TToken[], chainID: number): TDict<TNormalizedBN> => {
			const missingPrices: TDict<TNormalizedBN> = {};
			const allPrices: TDict<TNormalizedBN> = {};
			for (const token of tokens) {
				const tokenExists =
					prices[chainID]?.[toAddress(token.address)] || pricesFromList[chainID]?.[toAddress(token.address)];
				const tokenPrice =
					prices[chainID]?.[toAddress(token.address)] ||
					pricesFromList[chainID]?.[toAddress(token.address)] ||
					toNormalizedBN(0, 6);

				if (!tokenExists) {
					missingPrices[toAddress(token.address)] = tokenPrice;
				} else {
					allPrices[toAddress(token.address)] = tokenPrice;
				}
			}
			if (Object.keys(missingPrices).length) {
				fetchLists(
					Object.keys(missingPrices).map(addr => ({chainID, address: toAddress(addr)})),
					set_prices
				);
			}
			return allPrices;
		},
		[fetchLists, prices, pricesFromList]
	);

	const mergedPrices = useMemo(() => {
		const newPrices = {...prices};
		for (const chainID in pricesFromList) {
			if (!newPrices[chainID]) {
				newPrices[chainID] = {};
			}
			for (const address in pricesFromList[chainID]) {
				if (toBigInt(newPrices[chainID][toAddress(address)]?.raw) === 0n) {
					newPrices[chainID][toAddress(address)] = pricesFromList[chainID][toAddress(address)];
				}
			}
		}
		return newPrices;
	}, [prices, pricesFromList]);

	const pricingHash = useMemo(() => {
		return createUniqueID(serialize(mergedPrices));
	}, [mergedPrices]);

	return (
		<PricesContext.Provider value={{prices: mergedPrices, getPrice, getPrices, pricingHash}}>
			{children}
		</PricesContext.Provider>
	);
};

export const usePrices = (): TPricesProps => {
	const ctx = useContext(PricesContext);
	if (!ctx) {
		throw new Error('PricesContext not found');
	}
	return ctx;
};
