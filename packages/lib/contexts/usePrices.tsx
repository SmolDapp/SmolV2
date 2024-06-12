import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {serialize} from 'wagmi';
import axios from 'axios';
import {toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {useDeepCompareEffect} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {
	assignLlamaPrices,
	assignYDaemonPrices,
	mergeLlamaResponse,
	prepareQueryStringForLlama,
	prepareQueryStringForYDaemon,
	usePricesDefaultProps
} from './usePrices.helpers';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TGetPriceProps, TPrices, TPricesProps, TPriceTokens} from '@lib/types/hook.usePrices';

const PricesContext = createContext<TPricesProps>(usePricesDefaultProps);
export const WithPrices = ({children}: {children: ReactElement}): ReactElement => {
	const [pricesFromList, set_pricesFromList] = useState<TPrices>({});
	const [prices, set_prices] = useState<TPrices>({});
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

			/**************************************************************************************
			 ** Once we know what to fetch, we will use the Promise.allSettled function to fetch
			 ** the prices from the yDaemon and llama endpoints, waiting for all requests to be
			 ** resolved or rejected before updating the prices.
			 *************************************************************************************/
			const [pricesFromYDaemon, ...allPricesFromLlama] = await Promise.allSettled([
				axios.post('https://ydaemon.yearn.fi/prices/some', {addresses: queryStringForYDaemon}),
				...llamaRequests
			]);

			/**************************************************************************************
			 ** For simplicity, we will merge the prices from the llama endpoint in a single object
			 ** as if it was a single request.
			 *************************************************************************************/
			const pricesFromLlama = mergeLlamaResponse(allPricesFromLlama);

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
		({chainID, address}: TGetPriceProps): TNormalizedBN | undefined => {
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

	/**********************************************************************************************
	 ** This function will be used to get the prices of a list of tokens on a given chain.
	 ** Over the token iterations, it will check if the price is available in the prices object and
	 ** trigger a fetch of the full list of unavailable prices at the end.
	 *********************************************************************************************/
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

	/**********************************************************************************************
	 ** We will merge the prices from the prices object and the pricesFromList object to have the
	 ** most up-to-date prices.
	 *********************************************************************************************/
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

	/**********************************************************************************************
	 ** We will create a hash of the prices object to prevent some issues with hooks, memoization
	 ** and array comparison.
	 *********************************************************************************************/
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
