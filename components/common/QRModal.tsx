import {Fragment, type ReactElement, useState} from 'react';
import {cl} from '@builtbymom/web3/utils/cl';
import {Dialog, Transition} from '@headlessui/react';
import {IconClone} from '@icons/IconClone';
import {IconCross} from '@icons/IconCross';

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
	const [isCopied, set_isCopied] = useState<boolean>(false);
	const onCopyAddress = async (): Promise<void> => {
		await navigator.clipboard.writeText(props.address);
		set_isCopied(true);
		setTimeout(() => set_isCopied(false), 2000);
	};
	return (
		<Transition.Root
			show={props.isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={props.onClose}>
				<Transition.Child
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity'} />
				</Transition.Child>

				<div className={'fixed inset-0 z-[1001] overflow-y-auto'}>
					<div
						className={
							'flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0'
						}>
						<Transition.Child
							as={Fragment}
							enter={'ease-out duration-300'}
							enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
							enterTo={'opacity-100 translate-y-0 sm:scale-100'}
							leave={'ease-in duration-200'}
							leaveFrom={'opacity-100 translate-y-0 sm:scale-100'}
							leaveTo={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}>
							<Dialog.Panel
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
										<Dialog.Title
											as={'h3'}
											className={
												'text-primary-900 mx-2 text-xl font-bold leading-6 md:mx-4 md:text-3xl'
											}>
											{props.title}
										</Dialog.Title>

										<div className={'mt-3 md:mt-6'}>
											<p className={'mb-10 text-neutral-900/80'}>{props.content}</p>
											<div className={'flex w-full justify-center'}>{props.children}</div>
										</div>
									</div>
								</div>
								<div
									className={
										'flex w-[200px] flex-col items-center justify-center gap-2 pt-10 text-center md:flex-row'
									}>
									<div className={'m-0 flex flex-col items-center md:mr-20 md:items-start'}>
										<p className={'md:text-md mb-1 text-sm text-neutral-600'}>{'Wallet address'}</p>
										<p className={'md:text-md text-xs text-neutral-900 sm:text-sm'}>
											{props.address}
										</p>
									</div>
									<button
										className={cl(
											'rounded-lg p-2 text-xs flex flex-row items-center',
											'bg-primary text-neutral-900 transition-colors hover:bg-primaryHover '
										)}
										onClick={onCopyAddress}>
										<IconClone className={'size-3'} />
										<p className={'ml-2 whitespace-nowrap text-xs'}>
											{isCopied ? 'Copied!' : 'Copy  address'}
										</p>
									</button>
								</div>
							</Dialog.Panel>
						</Transition.Child>
					</div>
				</div>
			</Dialog>
		</Transition.Root>
	);
};

export {QRModal};
