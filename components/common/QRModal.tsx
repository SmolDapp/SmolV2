import {Fragment, type ReactElement} from 'react';
import {Button} from 'components/Primitives/Button';
import {cl} from '@builtbymom/web3/utils/cl';
import {Dialog, Transition} from '@headlessui/react';

type TQRModalProps = {
	isOpen: boolean;
	onClose: VoidFunction;
	title?: string;
	content?: string;
	children: ReactElement;
};

const QRModal = (props: TQRModalProps): ReactElement => {
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
					<div className={'bg-primary-900/40 fixed inset-0 backdrop-blur-sm transition-opacity'} />
				</Transition.Child>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'}>
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
									'relative overflow-hidden flex flex-col items-center justify-center rounded-md !bg-neutral-200 !p-10 transition-all',
									'sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
								)}>
								<div>
									<div className={'text-center'}>
										<Dialog.Title
											as={'h3'}
											className={'text-primary-900 text-3xl font-bold leading-6'}>
											{props.title}
										</Dialog.Title>
										<div className={'mt-6'}>
											<p className={'text-neutral-900/80'}>{props.content}</p>
											<div className={'flex w-full justify-center'}>{props.children}</div>
										</div>
									</div>
								</div>
								<div
									className={
										'flex w-[200px] flex-col items-center justify-center gap-2 pt-10 text-center'
									}>
									<Button
										className={'w-full'}
										onClick={props.onClose}>
										{'close'}
									</Button>
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
