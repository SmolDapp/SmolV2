'use client';

import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {Fragment} from 'react';
import Confetti from 'react-dom-confetti';

import {IconCross} from '@lib/components/icons/IconCross';
import {cl} from '@lib/utils/helpers';

import type {ReactElement} from 'react';

type TModalWrapperProps = {
	isOpen: boolean;
	onClose: VoidFunction;
	children: ReactElement;
	shouldDisplayHeader?: boolean;
	title?: string;
	shouldTriggerConfettis?: boolean;
	className?: string;
};

export function ModalWrapper({
	isOpen,
	onClose,
	children,
	shouldDisplayHeader = false,
	shouldTriggerConfettis = false,
	title,
	className
}: TModalWrapperProps): ReactElement {
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
					<div className={'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity'} />
				</TransitionChild>
				<div className={'size-screen fixed inset-0 z-[1001] flex items-center justify-center'}>
					<Confetti
						active={shouldTriggerConfettis}
						config={{spread: 500}}
					/>
				</div>
				<div className={'fixed inset-0 z-[1001] overflow-y-auto'}>
					<div
						className={
							'flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0'
						}>
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
									'relative overflow-hidden flex max-w-2xl',
									'flex-col items-center justify-center rounded-md',
									'!bg-neutral-200 !p-10 transition-all',
									'sm:my-8 sm:w-full md:max-w-2xl sm:max-w-lg',
									className
								)}>
								{shouldDisplayHeader && (
									<div className={'top-0 flex'}>
										<button
											className={
												'absolute right-3 top-5 mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'
											}
											onClick={onClose}>
											<IconCross className={'size-4'} />
										</button>
										<DialogTitle
											as={'h3'}
											className={
												'text-primary-900 mx-2 text-xl font-bold leading-6 md:mx-4 md:text-3xl'
											}>
											{title}
										</DialogTitle>
									</div>
								)}
								{children}
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
