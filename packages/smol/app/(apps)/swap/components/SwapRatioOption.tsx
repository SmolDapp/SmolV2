'use client';

import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {usePlausible} from 'next-plausible';
import React from 'react';

import {useSwapFlow} from 'packages/smol/app/(apps)/swap/contexts/useSwapFlow.lifi';

import type {TSwapConfiguration} from 'packages/smol/app/(apps)/swap/types';
import type {ReactElement} from 'react';

export function SwapRatioOption(props: {
	label: string;
	details: string;
	value: TSwapConfiguration['order'];
}): ReactElement {
	const plausible = usePlausible();
	const {configuration, dispatchConfiguration} = useSwapFlow();

	return (
		<label
			className={'cursor-pointer'}
			htmlFor={props.label}>
			<div className={'group flex items-start gap-2 p-4 transition-colors hover:bg-neutral-400'}>
				<input
					onChange={() => {
						plausible(PLAUSIBLE_EVENTS.SWAP_SET_ORDER, {props: {order: props.value}});
						dispatchConfiguration({type: 'SET_ORDER', payload: props.value});
					}}
					id={props.label}
					defaultChecked={configuration.order === props.value}
					value={props.label}
					type={'radio'}
					className={
						'text-primary mt-0.5 size-4 !border border-neutral-400 !outline-none !ring-0 !ring-transparent !ring-offset-0'
					}
					name={'swapPreference'}
				/>
				<div>
					<p className={'text-sm text-neutral-900'}>{props.label}</p>
					<p className={'whitespace-pre text-xs text-neutral-600'}>{props.details}</p>
				</div>
			</div>
		</label>
	);
}
