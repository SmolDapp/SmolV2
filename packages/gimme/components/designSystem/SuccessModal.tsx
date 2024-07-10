import {Fragment, useState} from 'react';
import Confetti from 'react-dom-confetti';
import Image from 'next/image';
import {cl} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {useUpdateEffect} from '@react-hookz/web';
import {Button} from '@lib/primitives/Button';

import type {ReactElement} from 'react';

type TSuccessModal = {
	isOpen: boolean;
	onClose: VoidFunction;
	title: string;
	content: ReactElement | string;
	ctaLabel: string;
	className?: string;
};
function SuccessModal(props: TSuccessModal): ReactElement {
	const [shouldTriggerConfettis, set_shouldTriggerConfettis] = useState(false);

	useUpdateEffect((): void => {
		if (props.isOpen) {
			setTimeout((): void => set_shouldTriggerConfettis(true), 300);
		} else {
			set_shouldTriggerConfettis(false);
		}
	}, [props.isOpen]);

	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={props.onClose}>
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

				<div className={'size-screen fixed inset-0 z-[1001] flex items-center justify-center'}>
					<Confetti
						active={shouldTriggerConfettis}
						config={{spread: 500}}
					/>
				</div>
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
									'relative overflow-hidden flex flex-col items-center justify-center rounded-3xl !bg-neutral-200 transition-all',
									'sm:my-8 sm:w-full sm:max-w-[440px]',
									props.className
								)}>
								<div className={'relative flex w-full items-center justify-center'}>
									<Image
										className={'object-cover'}
										src={'/bg.svg'}
										width={440}
										height={232}
										alt={'bg'}
									/>
									<Image
										className={'absolute'}
										src={'/cloud-check.svg'}
										width={104}
										height={75}
										alt={'cloud'}
									/>
								</div>
								<div className={'w-full px-6 pt-10'}>
									<DialogTitle
										as={'h3'}
										className={'text-grey-800 text-center text-3xl leading-6'}>
										{props.title}
									</DialogTitle>
									<div className={'text-grey-700 mt-6 w-full'}>{props.content}</div>
								</div>
								<div
									className={
										'flex w-full flex-col items-center justify-center gap-2 p-6 text-center'
									}>
									<Button
										className={cl('w-full')}
										onClick={props.onClose}>
										{props.ctaLabel}
									</Button>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
export {SuccessModal};
