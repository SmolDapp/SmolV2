import React, {createContext, useContext, useMemo, useReducer, useState} from 'react';
import {optionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import {getNewInput} from '@lib/utils/helpers';

import type {TOptionalRenderProps} from 'lib/utils/react/optionalRenderProps';
import type {Dispatch, ReactElement} from 'react';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TEarnConfiguration = {
	asset: TTokenAmountInputElement;
	opportunity: TYDaemonVault | undefined;
};

export type TEarnActions =
	| {type: 'SET_ASSET'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_OPPORTUNITY'; payload: TYDaemonVault | undefined}
	| {type: 'RESET'; payload: undefined};

export type TEarn = {
	configuration: TEarnConfiguration;
	dispatchConfiguration: Dispatch<TEarnActions>;
	onResetEarn: () => void;
	isDeposited: boolean;
};

const defaultProps: TEarn = {
	configuration: {
		asset: getNewInput(),
		opportunity: undefined
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

			case 'RESET':
				return {
					asset: getNewInput(),
					opportunity: undefined
				};
		}
	};

	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);

	const [isDeposited, set_isDeposited] = useState<boolean>(false);

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
