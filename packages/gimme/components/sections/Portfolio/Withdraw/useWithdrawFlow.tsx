import React, {createContext, useContext, useMemo, useReducer} from 'react';
import {optionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';

import type {TOptionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TWithdrawConfiguration = {
	asset: TTokenAmountInputElement;
	vault: TYDaemonVault | undefined;
	tokenToReceive: TToken | undefined;
};

export type TWithdrawActions =
	| {type: 'SET_ASSET'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_VAULT'; payload: TYDaemonVault | undefined}
	| {type: 'SET_TOKEN_TO_RECEIVE'; payload: TToken}
	| {type: 'RESET'; payload: undefined};

export type TWithdraw = {
	configuration: TWithdrawConfiguration;
	dispatchConfiguration: Dispatch<TWithdrawActions>;
	onResetWithdraw: () => void;
};

const defaultProps: TWithdraw = {
	configuration: {
		asset: {
			amount: '',
			normalizedBigAmount: zeroNormalizedBN,
			isValid: 'undetermined',
			token: undefined,
			status: 'none',
			UUID: crypto.randomUUID()
		},
		vault: undefined,
		tokenToReceive: undefined
	},
	onResetWithdraw: (): void => undefined,
	dispatchConfiguration: (): void => undefined
};

const WithdrawContext = createContext<TWithdraw>(defaultProps);
export const WithdrawContextApp = ({
	children
}: {
	children: TOptionalRenderProps<TWithdraw, ReactElement>;
}): ReactElement => {
	const configurationReducer = (state: TWithdrawConfiguration, action: TWithdrawActions): TWithdrawConfiguration => {
		switch (action.type) {
			case 'SET_ASSET': {
				return {
					...state,
					asset: {...state.asset, ...action.payload}
				};
			}
			case 'SET_TOKEN_TO_RECEIVE': {
				return {
					...state,
					tokenToReceive: action.payload
				};
			}
			case 'SET_VAULT': {
				return {...state, vault: action.payload};
			}
			case 'RESET': {
				return {
					asset: {
						amount: '',
						normalizedBigAmount: zeroNormalizedBN,
						isValid: 'undetermined',
						token: undefined,
						status: 'none',
						UUID: crypto.randomUUID()
					},
					vault: undefined,
					tokenToReceive: undefined
				};
			}
		}
	};

	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);

	const onResetWithdraw = (): void => {
		setTimeout((): void => {
			dispatch({type: 'RESET', payload: undefined});
		}, 500);
	};

	const contextValue = useMemo(
		(): TWithdraw => ({
			configuration,
			dispatchConfiguration: dispatch,
			onResetWithdraw
		}),
		[configuration]
	);

	return (
		<WithdrawContext.Provider value={contextValue}>
			{optionalRenderProps(children, contextValue)}
		</WithdrawContext.Provider>
	);
};

export const useWithdrawFlow = (): TWithdraw => {
	const ctx = useContext(WithdrawContext);
	if (!ctx) {
		throw new Error('WithdrawContext not found');
	}
	return ctx;
};
