import React, {createContext, useCallback, useContext, useMemo, useReducer, useRef, useState} from 'react';
import {optionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {toAddress, toBigInt, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getLifiRoutes, type TLifiQuoteResponse} from '@lib/utils/api.lifi';

import type {TOptionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import type {Dispatch, ReactElement} from 'react';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TEarnConfiguration = {
	asset: TTokenAmountInputElement;
	opportunity: TYDaemonVault | undefined;
	quote: {data: TLifiQuoteResponse | undefined; isLoading: boolean};
};

export type TEarnActions =
	| {type: 'SET_ASSET'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_OPPORTUNITY'; payload: TYDaemonVault | undefined}
	| {type: 'SET_QUOTE'; payload: Partial<{data: TLifiQuoteResponse | undefined; isLoading: boolean}>}
	| {type: 'RESET'; payload: undefined};

export type TEarn = {
	configuration: TEarnConfiguration;
	dispatchConfiguration: Dispatch<TEarnActions>;
	onResetEarn: () => void;
	isDeposited: boolean;
};

const defaultProps: TEarn = {
	configuration: {
		asset: {
			amount: '',
			normalizedBigAmount: zeroNormalizedBN,
			isValid: 'undetermined',
			token: undefined,
			status: 'none',
			UUID: crypto.randomUUID()
		},
		opportunity: undefined,
		quote: {data: undefined, isLoading: false}
	},
	isDeposited: false,
	onResetEarn: (): void => undefined,
	dispatchConfiguration: (): void => undefined
};

const EarnContext = createContext<TEarn>(defaultProps);
export const EarnContextApp = ({children}: {children: TOptionalRenderProps<TEarn, ReactElement>}): ReactElement => {
	const configurationReducer = (state: TEarnConfiguration, action: TEarnActions): TEarnConfiguration => {
		switch (action.type) {
			case 'SET_ASSET': {
				return {
					...state,
					asset: {...state.asset, ...action.payload}
				};
			}
			case 'SET_OPPORTUNITY': {
				return {
					...state,
					opportunity: action.payload
				};
			}
			case 'SET_QUOTE': {
				return {...state, quote: {...state.quote, ...action.payload}};
			}
			case 'RESET':
				return {
					asset: {
						amount: '',
						normalizedBigAmount: zeroNormalizedBN,
						isValid: 'undetermined',
						token: undefined,
						status: 'none',
						UUID: crypto.randomUUID()
					},
					opportunity: undefined,
					quote: {data: undefined, isLoading: false}
				};
		}
	};

	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const {address} = useWeb3();

	const [isDeposited, set_isDeposited] = useState<boolean>(false);

	const quoteAbortController = useRef<AbortController>(new AbortController());

	const onRetrieveQuote = useCallback(async () => {
		dispatch({type: 'SET_QUOTE', payload: {isLoading: true}});
		const {result, error} = await getLifiRoutes({
			fromAddress: toAddress(address),
			toAddress: toAddress(address),
			fromAmount: toBigInt(configuration.asset.normalizedBigAmount.raw).toString(),
			fromChainID: configuration.asset.token?.chainID || -1,
			fromTokenAddress: toAddress(configuration.asset.token?.address),
			toChainID: configuration.opportunity?.chainID || -1,
			toTokenAddress: toAddress(configuration.opportunity?.address), // TODO: change to vault address
			slippage: 0.01,
			order: 'RECOMMENDED',
			abortController: quoteAbortController.current // TODO: add
		});
		console.log(result, error);
		dispatch({type: 'SET_QUOTE', payload: {isLoading: false}});

		return result;
	}, [
		address,
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token?.address,
		configuration.asset.token?.chainID,
		configuration.opportunity?.address,
		configuration.opportunity?.chainID
	]);

	useAsyncTrigger(async (): Promise<void> => {
		/******************************************************************************************
		 * Skip quote fetching if for is not populdatet fully or zap is not needed
		 *****************************************************************************************/
		if (
			!configuration.asset.token ||
			!configuration.opportunity ||
			configuration.asset.token?.address === configuration.opportunity?.token.address
		) {
			return dispatch({type: 'SET_QUOTE', payload: {data: undefined}});
		}
		const quote = await onRetrieveQuote();
		dispatch({type: 'SET_QUOTE', payload: {data: quote}});
	}, [configuration.asset.token, configuration.opportunity, onRetrieveQuote]);

	const onResetEarn = (): void => {
		set_isDeposited(true);
		setTimeout((): void => {
			dispatch({type: 'RESET', payload: undefined});
			set_isDeposited(false);
		}, 500);
	};

	const contextValue = useMemo(
		(): TEarn => ({
			configuration,
			dispatchConfiguration: dispatch,
			onResetEarn,
			isDeposited
		}),
		[configuration, isDeposited]
	);

	return (
		<EarnContext.Provider value={contextValue}>{optionalRenderProps(children, contextValue)}</EarnContext.Provider>
	);
};

export const useEarnFlow = (): TEarn => {
	const ctx = useContext(EarnContext);
	if (!ctx) {
		throw new Error('EarnContext not found');
	}
	return ctx;
};
