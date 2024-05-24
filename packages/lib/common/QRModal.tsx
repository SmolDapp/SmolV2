import {Fragment, type ReactElement, useCallback} from 'react';
import toast from 'react-hot-toast';
import {toAddress} from '@builtbymom/web3/utils';
import {cl} from '@builtbymom/web3/utils/cl';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {IconClone} from '@lib/icons/IconClone';
import {IconCross} from '@lib/icons/IconCross';

import type {TAddress} from '@builtbymom/web3/types';

type TQRModalProps = {
	isOpen: boolean;
	onClose: VoidFunction;
	title?: string;
	content?: string;
	children: ReactElement;
	address: TAddress;
};

const QRModal = (props: TQRModalProps): ReactElement => {
	const onCopyAddress = useCallback(async (): Promise<void> => {
		await navigator.clipboard.writeText(props.address);
		toast.success(`Address copied to clipboard: ${toAddress(props.address)}`);
	}, [props.address]);

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
					<div className={'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity'} />
				</TransitionChild>

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
									'relative overflow-hidden flex max-w-2xl flex-col items-center justify-center rounded-md !bg-neutral-200 !p-10 transition-all',
									'sm:my-8 sm:w-full md:max-w-2xl sm:max-w-lg'
								)}>
								<div>
									<div className={'text-center'}>
										<button
											className={
												'absolute right-3 top-5 mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'
											}
											onClick={props.onClose}>
											<IconCross className={'size-4'} />
										</button>
										<DialogTitle
											as={'h3'}
											className={
												'text-primary-900 mx-2 text-xl font-bold leading-6 md:mx-4 md:text-3xl'
											}>
											{props.title}
										</DialogTitle>

										<div className={'mt-3 md:mt-6'}>
											<p className={'mb-10 text-neutral-900/80'}>{props.content}</p>
											<div className={'flex w-full justify-center'}>{props.children}</div>
										</div>
									</div>
								</div>
								<div className={'flex flex-col gap-2 pt-10'}>
									<div className={'m-0 flex flex-col items-center'}>
										<p className={'mb-1 text-xs text-neutral-600 md:text-base'}>
											{'Wallet address'}
										</p>
										<button
											className={cl(
												'text-xs flex items-center mt-1',
												'text-neutral-900 transition-colors'
											)}
											onClick={onCopyAddress}>
											<p className={'md:text-md mr-1 text-xs text-neutral-900 sm:text-sm'}>
												{props.address}
											</p>
											<IconClone className={'size-3 md:size-4'} />
										</button>
									</div>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
};

export {QRModal};
