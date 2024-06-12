import {createContext, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import {createUniqueID} from 'packages/lib/utils/tools.identifiers';
import {erc20Abi} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {
	decodeAsBigInt,
	decodeAsNumber,
	decodeAsString,
	isEthAddress,
	isZeroAddress,
	toAddress,
	toNormalizedBN,
	truncateHex,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {getNetwork, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useSyncUrlParams} from '@smolHooks/useSyncUrlParams';
import {getBalance, readContracts, serialize} from '@wagmi/core';
import {optionalRenderProps} from '@lib/utils/react/optionalRenderProps';
import {getStateFromUrlQuery} from '@lib/utils/url/getStateFromUrlQuery';

import {getNewInputToken, useSwapFlow} from './useSwapFlow.lifi';

import type {GetServerSideProps} from 'next';
import type {ReactElement} from 'react';
import type {TPartialExhaustive} from '@lib/types/utils';
import type {TOptionalRenderProps} from '@lib/utils/react/optionalRenderProps';

type TSwapQuery = TPartialExhaustive<{
	chainFrom: number;
	chainTo: number;
	tokenFrom: string;
	tokenTo: string;
	receiver: string;
}>;

type TSwapQueryManagement = {
	stateFromUrl: TSwapQuery;
	initialStateFromUrl: TSwapQuery | null;
	hasInitialInputs: boolean;
};

const defaultProps = {
	stateFromUrl: {tokenFrom: '', tokenTo: '', receiver: '', chainFrom: 0, chainTo: 0},
	initialStateFromUrl: null,
	hasInitialInputs: false
};

const SwapQueryManagementContext = createContext<TSwapQueryManagement>(defaultProps);
export const SwapQueryManagement = (props: {
	children: TOptionalRenderProps<TSwapQueryManagement, ReactElement>;
}): ReactElement => {
	const router = useRouter();
	const {address} = useWeb3();
	const searchParams = new URLSearchParams(router.asPath.split('?')[1]);
	const queryParams = Object.fromEntries(searchParams.entries());
	const {dispatchConfiguration, configuration} = useSwapFlow();
	const currentIdentifier = useRef({
		input: '',
		output: '',
		receiver: ''
	});
	const [hasFinishedInitialFetch, set_hasFinishedInitialFetch] = useState({
		input: false,
		output: false,
		receiver: false
	});

	/**********************************************************************************************
	 ** InitialStateFromUrl is the initial state of the URL parameters. This is the one we received
	 ** from the URL when the page was first loaded.
	 ** StateFromUrl is the current state of the URL parameters. This is the one we are currently
	 ** using in the application, which might be different from the initial state.
	 **
	 ** @dev It's important to use useDeepCompareMemo to avoid unnecessary re-renders.
	 *********************************************************************************************/
	const initialStateFromUrl = useDeepCompareMemo(
		() =>
			getStateFromUrlQuery<TSwapQuery>(queryParams, ({string, number}) => ({
				chainFrom: number('chainFrom'), // The ID of the chain where the tokenFrom is located
				chainTo: number('chainTo'), // The ID of the chain where the tokenTo is located
				tokenFrom: string('tokenFrom'), // The address of the tokenFrom
				tokenTo: string('tokenTo'), // The address of the tokenTo
				receiver: string('receiver') // The address of the receiver
			})),
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);
	const stateFromUrl = useDeepCompareMemo(() => {
		return getStateFromUrlQuery<TSwapQuery>(queryParams, ({string, number}) => ({
			chainFrom: number('chainFrom'), // The ID of the chain where the tokenFrom is located
			chainTo: number('chainTo'), // The ID of the chain where the tokenTo is located
			tokenFrom: string('tokenFrom'), // The address of the tokenFrom
			tokenTo: string('tokenTo'), // The address of the tokenTo
			receiver: string('receiver') // The address of the receiver
		}));
	}, [queryParams]);

	/**********************************************************************************************
	 ** The useSyncUrlParams hook will make sure that every time the configuration changes for the
	 ** token from, token to or receiver, the URL will be updated with the new values.
	 ** This is useful for sharing the URL with the current configuration.
	 *********************************************************************************************/
	useSyncUrlParams(
		{
			tokenFrom: isZeroAddress(configuration.input.token?.address)
				? ''
				: toAddress(configuration.input.token?.address),
			chainFrom: configuration.input.token?.chainID || undefined,
			tokenTo: isZeroAddress(configuration.output.token?.address)
				? ''
				: toAddress(configuration.output.token?.address),
			chainTo: configuration.output.token?.chainID || undefined,
			receiver: isZeroAddress(configuration.receiver.address) ? '' : configuration.receiver.address
		},
		!hasFinishedInitialFetch.input && !hasFinishedInitialFetch.output && !hasFinishedInitialFetch.receiver
	);

	/**********************************************************************************************
	 ** The URL parameters only contains a very limited set of information, such as the token
	 ** addresses and chain IDs. This information is used to fetch the token information from the
	 ** blockchain.
	 ** As we don't want to clear the state and to unnecessarily back and forth, we will use the
	 ** following callback to fetch and populate our inputs fields based on the URL parameters.
	 ** We have 3 different functions to properly populate the input, output and receiver fields:
	 ** - populateInputArgs
	 ** - populateOutputArgs
	 ** - populateReceiverArgs
	 ** The choice of three different functions is made to have a better control over the fetches
	 ** and to avoid unnecessary fetches.
	 *********************************************************************************************/
	const populateInputArgs = useCallback(async () => {
		/******************************************************************************************
		 ** The first thing to do is to create a unique identifier based on the current state. This
		 ** identifier is stored in a useRef to avoid unnecessary re-renders and keep the data
		 ** consistent.
		 ** It contains information about the current fetch we are doing, in order to avoid doing
		 ** multiple time the same fetches just because some underlying unrelated state has
		 ** changed.
		 *****************************************************************************************/
		const identifier = createUniqueID(
			serialize({
				...stateFromUrl,
				owner: address,
				currentFrom: toAddress(configuration.input.token?.address)
			})
		);
		if (currentIdentifier.current.input === identifier) {
			return;
		}
		currentIdentifier.current.input = identifier;

		/******************************************************************************************
		 ** Then, we want to fetch the token information based on what is in the URL.
		 ** If a tokenFrom and a chainFrom are provided, and if the currently selected from token
		 ** is not the same as the one in the URL, we fetch the from token information.
		 ** These informations includes the token symbol, the token decimals and the balance
		 ** of the connected user, if a wallet is connected.
		 *****************************************************************************************/
		const {chainFrom, tokenFrom} = stateFromUrl;
		const calls = [];
		if (chainFrom && tokenFrom && toAddress(configuration.input.token?.address) !== toAddress(tokenFrom)) {
			if (isEthAddress(tokenFrom)) {
				const balance = await getBalance(retrieveConfig(), {address: toAddress(address), chainId: chainFrom});
				const nativeCoin = getNetwork(chainFrom).nativeCurrency;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenFrom),
					chainID: chainFrom,
					symbol: nativeCoin.symbol,
					decimals: nativeCoin.decimals,
					name: nativeCoin.symbol,
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainFrom}/${tokenFrom}/logo-128.png`,
					value: 0,
					balance: isZeroAddress(address)
						? zeroNormalizedBN
						: toNormalizedBN(balance.value, nativeCoin.decimals)
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				dispatchConfiguration({type: 'SET_INPUT_VALUE', payload: newToken});
			} else {
				const from = {abi: erc20Abi, address: toAddress(tokenFrom), chainId: chainFrom};
				calls.push({...from, functionName: 'symbol'});
				calls.push({...from, functionName: 'decimals'});
				if (!isZeroAddress(address)) {
					calls.push({...from, functionName: 'balanceOf', args: [address]});
				}

				if (!calls.length) {
					return;
				}

				/******************************************************************************************
				 ** Once we have a valid result, we just need to update the configuration with the new
				 ** token information, mimicking the user input.
				 *****************************************************************************************/
				const result = await readContracts(retrieveConfig(), {contracts: calls});
				const [symbol, decimals, balance] = result.splice(0, 3);
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenFrom),
					chainID: chainFrom,
					symbol: decodeAsString(symbol),
					decimals: decodeAsNumber(decimals),
					name: decodeAsString(symbol),
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainFrom}/${tokenFrom}/logo-128.png`,
					value: 0,
					balance: toNormalizedBN(decodeAsBigInt(balance), decodeAsNumber(decimals))
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				dispatchConfiguration({type: 'SET_INPUT_VALUE', payload: newToken});
			}
		}

		/******************************************************************************************
		 ** And finally, we can mark the fetch as done. This state will prevent the hook from
		 ** being called again, stating that the initial fetch has been done.
		 *****************************************************************************************/
		set_hasFinishedInitialFetch(prev => ({...prev, input: true}));
	}, [address, configuration.input.token?.address, dispatchConfiguration, stateFromUrl]);

	const populateOuputArgs = useCallback(async () => {
		/******************************************************************************************
		 ** The first thing to do is to create a unique identifier based on the current state. This
		 ** identifier is stored in a useRef to avoid unnecessary re-renders and keep the data
		 ** consistent.
		 ** It contains information about the current fetch we are doing, in order to avoid doing
		 ** multiple time the same fetches just because some underlying unrelated state has
		 ** changed.
		 *****************************************************************************************/
		const identifier = createUniqueID(
			serialize({
				...stateFromUrl,
				owner: address,
				currentTo: toAddress(configuration.output.token?.address)
			})
		);
		if (currentIdentifier.current.output === identifier) {
			return;
		}
		currentIdentifier.current.output = identifier;

		/******************************************************************************************
		 ** Then, we want to fetch the token information based on what is in the URL.
		 ** If a tokenTo and a chainTo are provided, and if the currently selected from token
		 ** is not the same as the one in the URL, we fetch the to token information.
		 ** These informations includes the token symbol, the token decimals and the balance
		 ** of the connected user, if a wallet is connected.
		 *****************************************************************************************/
		const {chainTo, tokenTo} = stateFromUrl;
		const calls = [];
		if (chainTo && tokenTo && toAddress(configuration.output.token?.address) !== toAddress(tokenTo)) {
			if (isEthAddress(tokenTo)) {
				const balance = await getBalance(retrieveConfig(), {address: toAddress(address), chainId: chainTo});
				const nativeCoin = getNetwork(chainTo).nativeCurrency;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenTo),
					chainID: chainTo,
					symbol: nativeCoin.symbol,
					decimals: nativeCoin.decimals,
					name: nativeCoin.symbol,
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainTo}/${tokenTo}/logo-128.png`,
					value: 0,
					balance: isZeroAddress(address)
						? zeroNormalizedBN
						: toNormalizedBN(balance.value, nativeCoin.decimals)
				};
				dispatchConfiguration({type: 'SET_OUTPUT_VALUE', payload: newToken});
			} else {
				const to = {abi: erc20Abi, address: toAddress(tokenTo), chainId: chainTo};
				calls.push({...to, functionName: 'symbol'});
				calls.push({...to, functionName: 'decimals'});
				if (!isZeroAddress(address)) {
					calls.push({...to, functionName: 'balanceOf', args: [address]});
				}

				if (!calls.length) {
					return;
				}

				/******************************************************************************************
				 ** Once we have a valid result, we just need to update the configuration with the new
				 ** token information, mimicking the user input.
				 *****************************************************************************************/
				const result = await readContracts(retrieveConfig(), {contracts: calls});
				const [symbol, decimals, balance] = result.splice(0, 3);
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenTo),
					chainID: chainTo,
					symbol: decodeAsString(symbol),
					decimals: decodeAsNumber(decimals),
					name: decodeAsString(symbol),
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainTo}/${tokenTo}/logo-128.png`,
					value: 0,
					balance: toNormalizedBN(decodeAsBigInt(balance), decodeAsNumber(decimals))
				};
				dispatchConfiguration({type: 'SET_OUTPUT_VALUE', payload: newToken});
			}
		}

		/******************************************************************************************
		 ** And finally, we can mark the fetch as done. This state will prevent the hook from
		 ** being called again, stating that the initial fetch has been done.
		 *****************************************************************************************/
		set_hasFinishedInitialFetch(prev => ({...prev, output: true}));
	}, [address, configuration.output.token?.address, dispatchConfiguration, stateFromUrl]);

	const populateReceiverArgs = useCallback(async () => {
		/******************************************************************************************
		 ** The first thing to do is to create a unique identifier based on the current state. This
		 ** identifier is stored in a useRef to avoid unnecessary re-renders and keep the data
		 ** consistent.
		 ** It contains information about the current fetch we are doing, in order to avoid doing
		 ** multiple time the same fetches just because some underlying unrelated state has
		 ** changed.
		 *****************************************************************************************/
		const identifier = createUniqueID(
			serialize({
				...stateFromUrl,
				receiver: configuration.receiver.address
			})
		);
		if (currentIdentifier.current.receiver === identifier) {
			return;
		}
		currentIdentifier.current.receiver = identifier;

		/******************************************************************************************
		 ** If the receiver address is provided, we update the receiver address in the configuration.
		 *****************************************************************************************/
		if (!isZeroAddress(stateFromUrl.receiver)) {
			dispatchConfiguration({
				type: 'SET_RECEIVER',
				payload: {
					address: toAddress(stateFromUrl.receiver),
					label: truncateHex(toAddress(stateFromUrl.receiver), 8),
					source: 'autoPopulate'
				}
			});
		}

		/******************************************************************************************
		 ** And finally, we can mark the fetch as done. This state will prevent the hook from
		 ** being called again, stating that the initial fetch has been done.
		 *****************************************************************************************/
		set_hasFinishedInitialFetch(prev => ({...prev, receiver: true}));
	}, [configuration.receiver.address, dispatchConfiguration, stateFromUrl]);

	/**********************************************************************************************
	 ** The following useEffects will trigger the populate functions if the URL contains
	 ** information about the token from, token to and receiver. If not, this will directly say
	 ** that the initial fetch has been done for the corresponding element (aka nothing to do
	 ** here).
	 *********************************************************************************************/
	useEffect(() => {
		if (hasFinishedInitialFetch.input) {
			return;
		}
		const hasInitialStateFrom = initialStateFromUrl.tokenFrom && initialStateFromUrl.chainFrom;
		if (hasInitialStateFrom) {
			if (!hasFinishedInitialFetch.input) {
				populateInputArgs();
			}
		} else {
			set_hasFinishedInitialFetch(prev => ({...prev, input: true}));
		}
	}, [initialStateFromUrl, stateFromUrl, hasFinishedInitialFetch, populateInputArgs]);

	useEffect(() => {
		if (hasFinishedInitialFetch.output) {
			return;
		}
		const hasInitialStateTo = initialStateFromUrl.tokenTo && initialStateFromUrl.chainTo;
		if (hasInitialStateTo) {
			if (!hasFinishedInitialFetch.output) {
				populateOuputArgs();
			}
		} else {
			set_hasFinishedInitialFetch(prev => ({...prev, output: true}));
		}
	}, [initialStateFromUrl, stateFromUrl, hasFinishedInitialFetch, populateOuputArgs]);

	useEffect(() => {
		if (hasFinishedInitialFetch.receiver) {
			return;
		}
		const hasInitialStateReceiver = initialStateFromUrl.receiver && !isZeroAddress(initialStateFromUrl.receiver);
		if (hasInitialStateReceiver) {
			if (!hasFinishedInitialFetch.receiver) {
				populateReceiverArgs();
			}
		} else {
			set_hasFinishedInitialFetch(prev => ({...prev, receiver: true}));
		}
	}, [initialStateFromUrl, stateFromUrl, hasFinishedInitialFetch, populateReceiverArgs]);

	/**********************************************************************************************
	 ** Create the context value to be used by the children components.
	 *********************************************************************************************/
	const contextValue = useMemo(
		(): TSwapQueryManagement => ({
			stateFromUrl,
			initialStateFromUrl,
			hasInitialInputs: Boolean(initialStateFromUrl)
		}),
		[initialStateFromUrl, stateFromUrl]
	);

	return (
		<SwapQueryManagementContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</SwapQueryManagementContext.Provider>
	);
};

/**************************************************************************************************
 ** Exporting this will tell the vercel host that we need the query argument for the first render.
 ** Without it, the first render will ignore the query parameters.
 *************************************************************************************************/
export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
