import React, {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {optionalRenderProps} from '@lib/utils/react/optionalRenderProps';

import {useDisperseConfigurationReducer, useDisperseDefaultProps} from './useDisperse.helpers';

import type {ReactElement} from 'react';
import type {TDisperseContext} from '@lib/types/app.disperse';
import type {TOptionalRenderProps} from '@lib/utils/react/optionalRenderProps';

const DisperseContext = createContext<TDisperseContext>(useDisperseDefaultProps);
export const DisperseContextApp = (props: {
	children: TOptionalRenderProps<TDisperseContext, ReactElement>;
}): ReactElement => {
	const [isDispersed, set_isDispersed] = useState<boolean>(false);
	const [configuration, dispatch] = useReducer(
		useDisperseConfigurationReducer,
		useDisperseDefaultProps.configuration
	);

	/**********************************************************************************************
	 ** onResetDisperse is a callback function that will reset the disperse configuration and
	 ** disperse the UI.
	 ** It will first set the `isDispersed` state to true, then wait for 500ms before resetting the
	 ** configuration and setting the `isDispersed` state to false.
	 *********************************************************************************************/
	const onResetDisperse = useCallback((): void => {
		set_isDispersed(true);
		setTimeout((): void => {
			dispatch({type: 'RESET', payload: undefined});
			set_isDispersed(false);
		}, 500);
	}, []);

	/**********************************************************************************************
	 ** contextValue is a memoized object that will be passed to the DisperseContext.Provider in
	 ** order to provide the context to the children components and prevent some unwanted
	 ** re-renders.
	 *********************************************************************************************/
	const contextValue = useMemo(
		(): TDisperseContext => ({
			configuration,
			dispatchConfiguration: dispatch,
			isDispersed,
			onResetDisperse
		}),
		[configuration, onResetDisperse, isDispersed]
	);

	return (
		<DisperseContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</DisperseContext.Provider>
	);
};

/**************************************************************************************************
 ** Context accessor
 *************************************************************************************************/
export const useDisperse = (): TDisperseContext => {
	const ctx = useContext(DisperseContext);
	if (!ctx) {
		throw new Error('DisperseContext not found');
	}
	return ctx;
};
