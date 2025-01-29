'use client';

import {optionalRenderProps} from '@lib/utils/react/optionalRenderProps';
import {isAddress} from 'lib/utils/tools.addresses';
import {useSearchParams} from 'next/navigation';
import React, {createContext, useContext, useEffect, useMemo, useReducer} from 'react';

import {useSendConfigurationReducer, useSendDefaultProps} from './useSend.helpers';

import type {TOptionalRenderProps} from '@lib/utils/react/optionalRenderProps';
import type {TSendContext} from 'packages/smol/app/(apps)/send/types';
import type {ReactElement} from 'react';

const SendContext = createContext<TSendContext>(useSendDefaultProps);
export const SendContextApp = (props: {children: TOptionalRenderProps<TSendContext, ReactElement>}): ReactElement => {
	const searchParams = useSearchParams();
	const [configuration, dispatch] = useReducer(useSendConfigurationReducer, useSendDefaultProps.configuration);

	useEffect(() => {
		if (searchParams) {
			if (searchParams.has('to')) {
				const to = searchParams?.get('to');
				if (to && isAddress(to)) {
					dispatch({
						type: 'SET_RECEIVER',
						payload: {
							address: to,
							label: to
						}
					});
				}
			}
		}
	}, [searchParams]);

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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const useSendContext = (): TSendContext => {
	const ctx = useContext(SendContext);
	if (!ctx) {
		throw new Error('SendContext not found');
	}
	return ctx;
};
