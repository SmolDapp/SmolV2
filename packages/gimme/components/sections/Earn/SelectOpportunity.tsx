import {Fragment, type ReactElement} from 'react';
import {IconCross} from 'packages/lib/icons/IconCross';
import {cl} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';

import {Opportunity} from './Opportunity';

export function SelectOpportunity({isOpen, onClose}: {isOpen: boolean; onClose: () => void}): ReactElement {
	return (
		<Transition
			show={isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'fixed inset-0 backdrop-blur-sm transition-opacity'} />
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'}>
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
									'relative overflow-hidden flex flex-col items-center justify-center rounded-md !bg-white !px-2 !pt-2 !pb-6 transition-all',
									'sm:my-8 sm:w-full sm:max-w-lg sm:p-6 shadow-lg'
								)}>
								<div className={'flex w-full justify-between p-4'}>
									<p className={'font-bold'}>{'Stables Opportunities'}</p>
									<button
										className={'group'}
										onClick={onClose}>
										<IconCross
											className={
												'size-4 text-neutral-900 transition-colors group-hover:text-neutral-600'
											}
										/>
									</button>
								</div>
								<div className={'flex w-full flex-col gap-2'}>
									<Opportunity />
									<Opportunity />
									<Opportunity />
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
