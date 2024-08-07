import React, {createContext, useContext, useMemo, useReducer} from 'react';
import {optionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import {getNewInput} from '@lib/utils/helpers';

import type {TOptionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import type {ReactElement} from 'react';
import type {TWithdraw, TWithdrawActions, TWithdrawConfiguration} from './useWithdraw.types';

const defaultProps: TWithdraw = {
	configuration: {
		asset: getNewInput(),
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
			case 'SET_CONFIGURATION': {
				return action.payload;
			}
			case 'RESET': {
				return {
					asset: getNewInput(),
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
