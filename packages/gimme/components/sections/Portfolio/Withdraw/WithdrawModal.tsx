import {Fragment, type ReactElement, useCallback} from 'react';
import {cl, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {GimmeTokenAmountInput} from '@gimmeDesignSystem/GimmeTokenAmountInput';
import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';
import {IconCross} from '@lib/icons/IconCross';

import {FromVault} from './FromVault';
import {ToToken} from './ToToken';
import {useWithdrawFlow} from './useWithdrawFlow';
import {WithdrawWizard} from './WithdrawWizard';

import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';

type TWithdrawPopupProps = {
	isOpen: boolean;
	balances: TDict<TNormalizedBN>;
	onOpenChange: (isOpen: boolean) => void;
};

export function WithdrawModal(props: TWithdrawPopupProps): ReactElement {
	const {configuration, dispatchConfiguration} = useWithdrawFlow();

	const onSetAsset = useCallback(
		(value: Partial<TTokenAmountInputElement>): void => {
			dispatchConfiguration({type: 'SET_ASSET', payload: value});
		},
		[dispatchConfiguration]
	);

	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={() => props.onOpenChange(false)}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'bg-grey-500/80 fixed inset-0 backdrop-blur-md transition-opacity'} />
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-center justify-center text-center sm:p-0 md:p-4'}>
						<TransitionChild
							as={Fragment}
							enter={'ease-out duration-300'}
							enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
							enterTo={'opacity-100 translate-y-0 sm:scale-100'}
							leave={'ease-in duration-200'}
							leaveFrom={'opacity-100 translate-y-0 sm:scale-100'}
							leaveTo={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}>
							<DialogPanel
								className={cl(
									'relative overflow-hidden w-full flex mx-2 flex-col items-center justify-start rounded-3xl !bg-white transition-all',
									'sm:max-w-[560px] p-6'
								)}>
								<div className={'flex w-full justify-between pb-4'}>
									<p className={'text-grey-900 font-bold'}>{'Withdraw'}</p>
									<button
										className={'group'}
										onClick={() => props.onOpenChange(false)}>
										<IconCross
											className={
												'size-4 text-neutral-900 transition-colors group-hover:text-neutral-600'
											}
										/>
									</button>
								</div>
								<div className={'flex w-full flex-col gap-8'}>
									<div className={'flex w-full flex-col gap-1'}>
										{configuration.vault && (
											<FromVault
												vault={configuration.vault}
												balance={
													props.balances[configuration.vault.address] || zeroNormalizedBN
												}
											/>
										)}
										<GimmeTokenAmountInput
											onSetValue={onSetAsset}
											value={configuration.asset}
											shouldDisplayTokenLogo={false}
											shouldDisableSelect={true}
											title={'Amount'}
										/>
									</div>
									<div className={'flex flex-col gap-4'}>
										<p className={'text-grey-900 text-left font-bold'}>
											{'Receive to your wallet'}
										</p>
										<ToToken />
									</div>
									<WithdrawWizard onClose={() => props.onOpenChange(false)} />
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}