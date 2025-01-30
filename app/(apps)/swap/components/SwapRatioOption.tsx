'use client';

import {usePlausible} from 'next-plausible';
import React from 'react';

import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {useSwapFlow} from 'app/(apps)/swap/contexts/useSwapFlow.lifi';

import type {ReactElement} from 'react';

export function SwapRatioOption(props: {
	label: string;
	details: string;
	value: 'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST';
}): ReactElement {
	const plausible = usePlausible();
	const {order, setOrder} = useSwapFlow();

	return (
		<label
			className={'cursor-pointer'}
			htmlFor={props.label}>
			<div className={'group flex items-start gap-2 p-4 transition-colors hover:bg-neutral-400'}>
				<input
					onChange={() => {
						plausible(PLAUSIBLE_EVENTS.SWAP_SET_ORDER, {props: {order: props.value}});
						setOrder(props.value);
					}}
					id={props.label}
					defaultChecked={order === props.value}
					value={props.label}
					type={'radio'}
					className={
						'mt-0.5 size-4 !border border-neutral-400 text-primary !outline-none !ring-0 !ring-transparent !ring-offset-0'
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
