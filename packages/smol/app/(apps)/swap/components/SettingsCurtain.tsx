'use client';

import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import {usePlausible} from 'next-plausible';
import React from 'react';

import {CurtainContent, CurtainTitle} from '@lib/primitives/Curtain';
import {cl} from '@lib/utils/helpers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {SwapRatioOption} from 'packages/smol/app/(apps)/swap/components/SwapRatioOption';
import {useSwapFlow} from 'packages/smol/app/(apps)/swap/contexts/useSwapFlow.lifi';

import type {ReactElement} from 'react';

/**************************************************************************************************
 ** The TSwapCurtain type is used to type the props of the SwapCurtain component.
 *************************************************************************************************/
type TSwapCurtain = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

/**********************************************************************************************
 ** The SwapCurtain component is responsible for displaying the curtain with the list of
 ** tokens the user has in their wallet and a search bar to filter them.
 *************************************************************************************************/
export function SwapCurtain(props: TSwapCurtain): ReactElement {
	const plausible = usePlausible();
	const {slippageTolerance, setSlippageTolerance} = useSwapFlow();

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<CurtainTitle className={'font-bold'}>{'Swap settings'}</CurtainTitle>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<div className={'scrollable text-neutral-600'}>
							<p>{'Customize your swap settings, because why not?'}</p>
						</div>
						<div className={'my-1 h-px w-full bg-neutral-300'} />
						<div className={'scrollable mb-8 mt-0 flex flex-col items-center gap-2 pb-2'}>
							<div className={'w-full'}>
								<div className={'pb-2 pl-1'}>
									<p className={'text-sm text-neutral-900'}>{'Route preference'}</p>
									<p className={'text-xs text-neutral-600'}>
										{
											'Smol’s cross chain swaps are powered by Li.Fi. Smol priotizes the safest swap route by default but you can change your settings here. To learn more about the different options please feel free to check Li.Fi’s '
										}
										<Link
											target={'_blank'}
											className={'underline'}
											href={'https://apidocs.li.fi/reference/get_quote'}>
											{'docs'}
										</Link>
										{'.'}
									</p>
								</div>
								<div
									className={
										'grid divide-y divide-neutral-400 overflow-hidden rounded-lg bg-neutral-200'
									}>
									<SwapRatioOption
										label={'Recommended'}
										details={'Prioritize affordable and less complex routes.'}
										value={'RECOMMENDED'}
									/>

									<SwapRatioOption
										label={'Fastest'}
										details={'Prioritizes routes with the shortest estimated time.'}
										value={'FASTEST'}
									/>

									<SwapRatioOption
										label={'Cheapest'}
										details={'Try to minimize the cost of the transaction.'}
										value={'CHEAPEST'}
									/>

									<SwapRatioOption
										label={'Safest'}
										details={'Prioritizes routes with the least amount of risk of failure.'}
										value={'SAFEST'}
									/>
								</div>
							</div>

							<div className={'mt-4 w-full'}>
								<div className={'pb-2 pl-1'}>
									<p className={'text-sm text-neutral-900'}>{'Slippage tolerance'}</p>
									<p className={'text-xs text-neutral-600'}>
										{
											'Adjust your slippage tolerance for the price impact of your swap. If the price of the token changes by more than the set percentage, the swap will fail.'
										}
									</p>
								</div>

								<div
									className={
										'grid grid-cols-4 divide-x divide-neutral-400 overflow-hidden rounded-lg bg-neutral-200'
									}>
									<button
										onClick={() => {
											plausible(PLAUSIBLE_EVENTS.SWAP_SET_SLIPPAGE, {props: {slippage: 0.001}});
											setSlippageTolerance(0.001);
										}}
										className={cl(
											'p-2 text-center transition-colors hover:bg-neutral-400',
											slippageTolerance === 0.001
												? 'bg-neutral-400 text-neutral-900'
												: 'text-neutral-600'
										)}>
										<p className={'text-sm'}>{'0.1%'}</p>
									</button>
									<button
										onClick={() => {
											plausible(PLAUSIBLE_EVENTS.SWAP_SET_SLIPPAGE, {props: {slippage: 0.005}});
											setSlippageTolerance(0.005);
										}}
										className={cl(
											'p-2 text-center transition-colors hover:bg-neutral-400',
											slippageTolerance === 0.005
												? 'bg-neutral-400 text-neutral-900'
												: 'text-neutral-600'
										)}>
										<p className={'text-sm'}>{'0.5%'}</p>
									</button>
									<button
										onClick={() => {
											plausible(PLAUSIBLE_EVENTS.SWAP_SET_SLIPPAGE, {props: {slippage: 0.01}});
											setSlippageTolerance(0.01);
										}}
										className={cl(
											'p-2 text-center transition-colors hover:bg-neutral-400',
											slippageTolerance === 0.01
												? 'bg-neutral-400 text-neutral-900'
												: 'text-neutral-600'
										)}>
										<p className={'text-sm'}>{'1%'}</p>
									</button>
									<button
										onClick={() => {
											plausible(PLAUSIBLE_EVENTS.SWAP_SET_SLIPPAGE, {props: {slippage: 0.015}});
											setSlippageTolerance(0.015);
										}}
										className={cl(
											'p-2 text-center transition-colors hover:bg-neutral-400',
											slippageTolerance === 0.015
												? 'bg-neutral-400 text-neutral-900'
												: 'text-neutral-600'
										)}>
										<p className={'text-sm'}>{'1.5%'}</p>
									</button>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
