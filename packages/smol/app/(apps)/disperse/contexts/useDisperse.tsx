'use client';

import {useBalances} from '@lib/contexts/useBalances.multichains';
import {useSearchParams} from 'next/navigation';
import React, {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState} from 'react';
import {useChainId} from 'wagmi';

import {isAddress, toAddress} from '@lib/utils/tools.addresses';
import {
	useDisperseConfigurationReducer,
	useDisperseDefaultProps
} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse.helpers';

import type {TDisperseContext} from 'packages/smol/app/(apps)/disperse/types';
import type {ReactElement} from 'react';

/************************************************************************************************
 ** DisperseContext provides the context for managing token disperse operations
 ** This context handles:
 ** - Token selection and validation
 ** - Disperse configuration state
 ** - Reset and disperse operations
 ** - Chain-specific token balances
 ************************************************************************************************/
const DisperseContext = createContext<TDisperseContext>(useDisperseDefaultProps);

/************************************************************************************************
 ** DisperseContextApp is the provider component for the Disperse context
 **
 ** @param props - Contains children components to be wrapped
 ** @returns ReactElement - The provider component with state management
 **
 ** Features:
 ** - Manages disperse configuration state
 ** - Handles token initialization from URL params
 ** - Provides reset functionality
 ** - Syncs with chain and token balances
 **
 ** @example
 ** ```typescript
 ** <DisperseContextApp>
 **   <YourComponent />
 ** </DisperseContextApp>
 ** ```
 ************************************************************************************************/
export const DisperseContextApp = (props: {children: ReactElement}): ReactElement => {
	const chainId = useChainId();
	const searchParams = useSearchParams();
	const [isDispersed, setIsDispersed] = useState<boolean>(false);
	const [configuration, dispatch] = useReducer(
		useDisperseConfigurationReducer,
		useDisperseDefaultProps.configuration
	);

	/************************************************************************************************
	 ** Fetch initial token data based on URL parameters
	 ** Uses useBalances hook to get token information for the specified chain
	 ** Only fetches if a valid token address is provided in the URL
	 ************************************************************************************************/
	const {data: initialTokenRaw} = useBalances({
		tokens: [{address: toAddress(searchParams?.get('token')), chainID: chainId}]
	});

	/************************************************************************************************
	 ** Effect to initialize token from URL parameters
	 ** Sets the token in the configuration if:
	 ** - No token is currently selected
	 ** - A valid token address is in the URL
	 ** - The token exists in the current chain
	 ************************************************************************************************/
	useEffect(() => {
		if (!configuration.tokenToSend) {
			const initialToken =
				initialTokenRaw[chainId] && searchParams?.get('token') && isAddress(searchParams?.get('token'))
					? initialTokenRaw[chainId][toAddress(searchParams?.get('token'))]
					: undefined;
			if (initialToken) {
				dispatch({type: 'SET_TOKEN_TO_SEND', payload: initialToken});
			}
		}
	}, [initialTokenRaw, chainId, searchParams, configuration.tokenToSend]);

	/************************************************************************************************
	 ** onResetDisperse handles resetting the disperse configuration
	 **
	 ** Features:
	 ** - Sets disperse state to true temporarily
	 ** - Resets configuration after a delay
	 ** - Provides visual feedback during reset
	 **
	 ** The delay allows for:
	 ** - UI animations to complete
	 ** - State transitions to be visible
	 ** - Smooth user experience
	 ************************************************************************************************/
	const onResetDisperse = useCallback((): void => {
		setIsDispersed(true);
		setTimeout((): void => {
			dispatch({type: 'RESET', payload: undefined});
			setIsDispersed(false);
		}, 500);
	}, []);

	/************************************************************************************************
	 ** Memoized context value to prevent unnecessary re-renders
	 ** Includes:
	 ** - Current configuration state
	 ** - Dispatch function for updates
	 ** - Disperse status
	 ** - Reset functionality
	 **
	 ** This optimization ensures child components only re-render when necessary
	 ************************************************************************************************/
	const contextValue = useMemo(
		(): TDisperseContext => ({
			configuration,
			dispatchConfiguration: dispatch,
			isDispersed,
			onResetDisperse
		}),
		[configuration, onResetDisperse, isDispersed]
	);

	return <DisperseContext.Provider value={contextValue}>{props.children}</DisperseContext.Provider>;
};

/************************************************************************************************
 ** useDisperse hook provides access to the Disperse context
 **
 ** @returns TDisperseContext - The current disperse context state and functions
 **
 ** Features:
 ** - Type-safe context access
 ** - Throws error if used outside provider
 ** - Provides complete disperse functionality
 **
 ** @example
 ** ```typescript
 ** const { configuration, dispatchConfiguration, isDispersed, onResetDisperse } = useDisperse();
 ** ```
 **
 ** @throws Error if used outside of DisperseContextApp provider
 ************************************************************************************************/
export const useDisperse = (): TDisperseContext => {
	const ctx = useContext(DisperseContext);
	if (!ctx) {
		throw new Error('DisperseContext not found');
	}
	return ctx;
};
