import {Fragment, useMemo, useState} from 'react';
import Confetti from 'react-dom-confetti';
import Link from 'next/link';
import {cl} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {useUpdateEffect} from '@react-hookz/web';
import {IconCheck} from '@lib/icons/IconCheck';
import {Button} from '@lib/primitives/Button';

import type {ReactElement} from 'react';

type TSuccessModal = {
	isOpen: boolean;
	onClose: VoidFunction;
	title: string;
	content: ReactElement | string;
	ctaLabel: string;
	className?: string;
	downloadConfigButton?: JSX.Element;
	twitterShareContent?: string;
};
function SuccessModal(props: TSuccessModal): ReactElement {
	const [shouldTriggerConfettis, set_shouldTriggerConfettis] = useState(false);

	const tweetURL = useMemo(() => {
		if (props.twitterShareContent) {
			return `http://twitter.com/share?text=${props.twitterShareContent}&url=https://smold.app`;
		}
		return '';
	}, [props.twitterShareContent]);

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
					<div className={'fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity'} />
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
									'relative overflow-hidden flex flex-col items-center justify-center rounded-md !bg-neutral-200 !p-10 transition-all',
									'sm:my-8 sm:w-full sm:max-w-lg sm:p-6',
									props.className
								)}>
								<div className={'bg-green flex w-full items-center justify-center'}>
									<div className={'my-6 rounded-full bg-white p-4'}>
										<IconCheck className={'text-green size-10'} />
									</div>
								</div>
								<div className={'w-full px-10 pt-10'}>
									<DialogTitle
										as={'h3'}
										className={'text-primary-900 text-center text-3xl font-bold leading-6'}>
										{props.title}
									</DialogTitle>
									<div className={'mt-6 w-full text-neutral-900/80'}>{props.content}</div>
								</div>
								<div className={'flex flex-col items-center justify-center gap-2 py-6 text-center'}>
									{props.downloadConfigButton}
									<div className={'grid grid-cols-2 gap-4'}>
										<div className={cl(props.twitterShareContent ? '' : 'hidden')}>
											<Link
												href={tweetURL}
												target={'_blank'}>
												<Button
													variant={'light'}
													className={'!h-10 w-full'}>
													{'Share on Twitter'}
												</Button>
											</Link>
										</div>
										<Button
											className={cl(
												'!h-10 w-full',
												props.twitterShareContent ? 'col-span-1' : 'col-span-2'
											)}
											variant={'light'}
											onClick={props.onClose}>
											{props.ctaLabel}
										</Button>
									</div>
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
