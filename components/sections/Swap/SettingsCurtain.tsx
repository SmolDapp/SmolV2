'use client';

import React, {useEffect, useRef, useState} from 'react';
import {CloseCurtainButton} from 'components/designSystem/Curtains/InfoCurtain';
import {SmolAddressInput} from 'components/designSystem/SmolAddressInput';
import {CurtainContent} from 'components/Primitives/Curtain';
import {cl} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';

import {useSwapFlow} from './useSwapFlow.lifi';

import type {ReactElement} from 'react';
import type {TInputAddressLike} from '@utils/tools.address';

/**************************************************************************************************
 ** The TSwapCurtain type is used to type the props of the SwapCurtain component.
 *************************************************************************************************/
export type TSwapCurtain = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

/**********************************************************************************************
 ** The SwapCurtain component is responsible for displaying the curtain with the list of
 ** tokens the user has in their wallet and a search bar to filter them.
 *************************************************************************************************/
export function SwapCurtain(props: TSwapCurtain): ReactElement {
	const [, set_searchValue] = useState('');
	const {configuration, dispatchConfiguration} = useSwapFlow();
	const inputRef = useRef<HTMLInputElement>(null);
	const onSetRecipient = (value: Partial<TInputAddressLike>): void => {
		dispatchConfiguration({type: 'SET_RECEIVER', payload: value});
	};

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			set_searchValue('');
		}
	}, [props.isOpen]);

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'flex h-full flex-col overflow-y-hidden bg-neutral-0 p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Swap settings'}</h3>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<div className={'scrollable text-neutral-600'}>
							<p>{'You can customize a few elements of your swap to better suit your needs.'}</p>
						</div>
						<div className={'scrollable mb-8 flex flex-col items-center gap-2 pb-2'}>
							<div className={''}>
								<p className={'font-medium'}>{'Recipient'}</p>
								<div className={'mb-4 mt-1'}>
									<SmolAddressInput
										inputRef={inputRef}
										onSetValue={onSetRecipient}
										value={configuration.receiver}
									/>
								</div>
							</div>

							<div className={'w-full rounded-lg bg-neutral-200 p-4'}>
								<p className={'font-medium'}>{'Settings'}</p>
								<div className={'my-4'}>
									<p className={'text-sm text-neutral-600'}>{'Slippage'}</p>
									<input
										type={'number'}
										className={cl(
											'w-full rounded-lg border border-neutral-400 bg-neutral-200 bg-white p-2',
											'focus:border-neutral-400'
										)}
										placeholder={'0.5%'}
									/>
								</div>
								<div className={'my-4'}>
									<p className={'text-sm text-neutral-600'}>{'Slippage'}</p>
									<input
										type={'number'}
										className={cl(
											'w-full rounded-lg border border-neutral-400 bg-neutral-200 bg-white p-2',
											'focus:border-neutral-400'
										)}
										placeholder={'0.5%'}
									/>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
