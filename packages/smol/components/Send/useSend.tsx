/* eslint-disable no-case-declarations */
import React, {createContext, useContext, useMemo, useReducer} from 'react';
import {optionalRenderProps} from '@lib/utils/react/optionalRenderProps';

import {useSendConfigurationReducer, useSendDefaultProps} from './useSend.helpers';

import type {ReactElement} from 'react';
import type {TSendContext} from '@lib/types/app.send';
import type {TOptionalRenderProps} from '@lib/utils/react/optionalRenderProps';

const SendContext = createContext<TSendContext>(useSendDefaultProps);
export const SendContextApp = (props: {children: TOptionalRenderProps<TSendContext, ReactElement>}): ReactElement => {
	const [configuration, dispatch] = useReducer(useSendConfigurationReducer, useSendDefaultProps.configuration);

	const contextValue = useMemo(
		(): TSendContext => ({
			configuration,
			dispatchConfiguration: dispatch
		}),
		[configuration]
	);

	return (
		<SendContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</SendContext.Provider>
	);
};

export const useSend = (): TSendContext => {
	const ctx = useContext(SendContext);
	if (!ctx) {
		throw new Error('SendContext not found');
	}
	return ctx;
};
