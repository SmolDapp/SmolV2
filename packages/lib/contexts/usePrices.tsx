import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {serialize} from 'wagmi';
import axios from 'axios';
import {toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {useDeepCompareEffect} from '@react-hookz/web';
import {useTokensWithBalance} from '@lib/hooks/useTokensWithBalance';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {
	assignLlamaPrices,
	assignYDaemonPrices,
	mergeLlamaResponse,
	mergeYDaemonResponse,
	prepareQueryStringForLlama,
	prepareQueryStringForYDaemon,
	usePricesDefaultProps
} from './usePrices.helpers';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {Chain} from 'viem';
import type {TDict, TNDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TGetPriceProps, TPrices, TPricesProps, TPriceTokens} from '@lib/types/context.usePrices';

const PricesContext = createContext<TPricesProps>(usePricesDefaultProps);
export const WithPrices = (props: {children: ReactElement; supportedNetworks?: Chain[]}): ReactElement => {
	const [pricesFromList, set_pricesFromList] = useState<TPrices>({});
	const [fetchingQueue, set_fetchingQueue] = useState<TPriceTokens>([]);
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
	const tokensToUse = useMemo((): TPriceTokens => {
		const tokens = listAllTokensWithBalance();
		const tokensForThisChain = listTokensWithBalance();
		if (isLoadingOnCurrentChain && isLoading && !tokens.length) {
			return [];
		}
		if (!isLoadingOnCurrentChain && isLoading && tokensForThisChain.length) {
			return tokensForThisChain;
		}
		if (isLoading) {
			return [];
		}
		const supportedChainIDs = props.supportedNetworks?.map(chain => chain.id) || [];
		const _tokensToUse = [];
		for (const token of tokens) {
			if (supportedChainIDs.includes(token.chainID) || !supportedChainIDs || supportedChainIDs.length === 0) {
				_tokensToUse.push(token);
			}
		}

		for (const token of fetchingQueue) {
			if (!_tokensToUse.find(t => t.address === token.address)) {
				_tokensToUse.push(token as TToken);
			}
		}

		//If we already have the price in pricesFromList, we don't need to fetch it again
		const _newTokensToUse = [];
		for (const token of _tokensToUse) {
			if (!pricesFromList[token.chainID]?.[toAddress(token.address)]) {
				_newTokensToUse.push(token);
			}
		}

		return _newTokensToUse;
	}, [
		listAllTokensWithBalance,
		listTokensWithBalance,
		isLoadingOnCurrentChain,
		isLoading,
		props.supportedNetworks,
		fetchingQueue,
		pricesFromList
	]);

	/**********************************************************************************************
	 ** This function will fetch the prices for the tokens we want to use on the different
	 ** endpoints available. A priority is given to the llama endpoint, and if the llama endpoint
	 ** doesn't have the price, we will use the prices from the yDaemon endpoint.
	 *********************************************************************************************/
	const fetchLists = useCallback(
		async (_tokensToUse: TPriceTokens, dispatcher: Dispatch<SetStateAction<TPrices>>) => {
			const queryStringForYDaemon = prepareQueryStringForYDaemon(_tokensToUse);
			const queryStringForLlama = prepareQueryStringForLlama(_tokensToUse);
			if (!queryStringForYDaemon || !queryStringForLlama) {
				return;
			}

			/**************************************************************************************
			 ** The llama endpoint needs a GET request with some query arguments. In the web
			 ** standard, URLs are limited in size. Thus, if we have a lot of tokens to fetch, we
			 ** might have to split the request in multiple requests.
			 ** Thus, we will create an array of requests to fetch the prices for the tokens with
			 ** a batch of 100 tokens per request.
			 *************************************************************************************/
			const llamaRequests = [];
			if (_tokensToUse.length > 100) {
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
			const allPricesFromLlama = await Promise.allSettled(llamaRequests);
			const pricesFromLlama = mergeLlamaResponse(allPricesFromLlama);
			const assignedPricesFromLlama = assignLlamaPrices(pricesFromLlama, {});

			/**************************************************************************************
			 ** Now we want to create a new _tokensToUse array only with the tokens we are
			 ** missing the price
			 *************************************************************************************/
			const missingTokens = [];
			for (const chainID in assignedPricesFromLlama) {
				for (const address in assignedPricesFromLlama[chainID]) {
					if (!assignedPricesFromLlama[chainID][address]) {
						missingTokens.push({chainID: Number(chainID), address: toAddress(address)});
					} else if (assignedPricesFromLlama[chainID][address].raw === 0n) {
						missingTokens.push({chainID: Number(chainID), address: toAddress(address)});
					}
				}
			}

			/**************************************************************************************
			 ** The ydaemon endpoint needs a GET request with some query arguments. In the web
			 ** standard, URLs are limited in size. Thus, if we have a lot of tokens to fetch, we
			 ** might have to split the request in multiple requests.
			 ** Thus, we will create an array of requests to fetch the prices for the tokens with
			 ** a batch of 100 tokens per request.
			 *************************************************************************************/
			const ydaemonRequests = [];
			if (missingTokens.length > 100) {
				const tokens = missingTokens.slice();
				while (tokens.length) {
					const chunk = tokens.splice(0, 100);
					ydaemonRequests.push(
						axios.get(`https://ydaemon.yearn.fi/prices/some/${prepareQueryStringForYDaemon(chunk)}`)
					);
				}
			} else {
				ydaemonRequests.push(axios.get(`https://ydaemon.yearn.fi/prices/some/${queryStringForYDaemon}`));
			}
			const allPricesFromYDaemon = await Promise.allSettled(ydaemonRequests);
			const pricesFromYDaemon = mergeYDaemonResponse(allPricesFromYDaemon);

			/**************************************************************************************
			 ** We will update the prices object with the new prices from the llama and yDaemon
			 ** endpoints.
			 *************************************************************************************/
			dispatcher(previous => {
				let newPrices: typeof previous = {};
				for (const chainID in previous) {
					newPrices[chainID] = {...previous[chainID]};
				}
				newPrices = assignLlamaPrices(pricesFromLlama, newPrices);
				newPrices = assignYDaemonPrices(pricesFromYDaemon, newPrices);

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
	 ** If the price is not available, it will trigger a fetch to get the price of this token.
	 *********************************************************************************************/
	const getPrice = useCallback(
		({chainID, address}: TGetPriceProps, shouldFetch = true): TNormalizedBN | undefined => {
			const tokenExists = pricesFromList[chainID]?.[toAddress(address)];
			const tokenPrice = pricesFromList[chainID]?.[toAddress(address)] || undefined;

			if (!tokenExists && shouldFetch) {
				set_fetchingQueue(prev => {
					const newFetchingQueue = prev;
					if (!newFetchingQueue.find(t => t.address === address)) {
						return [...prev, {chainID, address: toAddress(address)}];
					}
					return prev;
				});
			}
			return tokenPrice;
		},
		[pricesFromList]
	);

	/**********************************************************************************************
	 ** This function will be used to get the prices of a list of tokens on a given chain.
	 ** Over the token iterations, it will check if the price is available in the prices object and
	 ** trigger a fetch of the full list of unavailable prices at the end.
	 *********************************************************************************************/
	const getPrices = useCallback(
		(tokens: TToken[]): TNDict<TDict<TNormalizedBN>> => {
			const missingPrices: TNDict<TDict<TNormalizedBN>> = {};
			const allPrices: TNDict<TDict<TNormalizedBN>> = {};
			for (const token of tokens) {
				const tokenExists = pricesFromList[token.chainID]?.[toAddress(token.address)];
				const tokenPrice = pricesFromList[token.chainID]?.[toAddress(token.address)] || toNormalizedBN(0, 6);

				if (!tokenExists) {
					if (!missingPrices[token.chainID]) {
						missingPrices[token.chainID] = {};
					}
					missingPrices[token.chainID][toAddress(token.address)] = tokenPrice;
				} else {
					if (!allPrices[token.chainID]) {
						allPrices[token.chainID] = {};
					}
					allPrices[token.chainID][toAddress(token.address)] = tokenPrice;
				}
			}
			if (Object.keys(missingPrices).length) {
				const tokensToFetch: TPriceTokens = [];
				for (const chainID in missingPrices) {
					for (const address in missingPrices[chainID]) {
						tokensToFetch.push({chainID: Number(chainID), address: toAddress(address)});
					}
				}
				set_fetchingQueue(prev => {
					const newFetchingQueue = prev;
					for (const token of tokensToFetch) {
						if (!newFetchingQueue.find(t => t.address === token.address)) {
							newFetchingQueue.push(token);
						}
					}
					return newFetchingQueue;
				});
			}
			return allPrices;
		},
		[pricesFromList]
	);

	/**********************************************************************************************
	 ** We will create a hash of the prices object to prevent some issues with hooks, memoization
	 ** and array comparison.
	 *********************************************************************************************/
	const pricingHash = useMemo(() => {
		return createUniqueID(serialize(pricesFromList));
	}, [pricesFromList]);

	return (
		<PricesContext.Provider value={{prices: pricesFromList, getPrice, getPrices, pricingHash}}>
			{props.children}
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
