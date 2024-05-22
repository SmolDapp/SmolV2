import {Fragment, type ReactElement} from 'react';
import {useDropzone} from 'react-dropzone';
import {cl} from '@builtbymom/web3/utils/cl';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {IconCross} from '@lib/icons/IconCross';
import {IconUpload} from '@lib/icons/IconUpload';

type TUploadFileModalProps = {
	isOpen: boolean;
	onClose: VoidFunction;
	title: string;
	description?: string | ReactElement;
	onBrowse: VoidFunction;
	uploadInput?: ReactElement;
	handleUpload: (files: Blob[]) => void;
	onDrop: (files: Blob[]) => void;
};

export const UploadFileModal = (props: TUploadFileModalProps): ReactElement => {
	const {onDrop, description, title, onClose, onBrowse, handleUpload, isOpen} = props;

	const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, noClick: true});

	const getHint = (): ReactElement => {
		if (isDragActive) {
			return <p>{'Drop to upload the file!'}</p>;
		}
		return (
			<p>
				{'Drag and Drop your files here or '}
				<button
					onClick={onBrowse}
					className={'underline'}>
					<input
						{...getInputProps()}
						id={'file-upload'}
						tabIndex={-1}
						className={'absolute inset-0 !cursor-pointer opacity-0'}
						type={'file'}
						accept={'.csv'}
						onClick={event => event.stopPropagation()}
						onChange={e => handleUpload(e.target.files as unknown as Blob[])}
					/>
					{'browse'}
				</button>
			</p>
		);
	};

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
									'relative overflow-hidden flex max-w-2xl flex-col items-center justify-center rounded-md !bg-neutral-200 !p-12 transition-all',
									'sm:my-8 sm:w-full md:max-w-2xl sm:max-w-lg'
								)}>
								<div>
									<div className={'text-center'}>
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
										<div className={'mt-1 text-neutral-600'}>{description}</div>
									</div>
								</div>
								<div className={'mt-4 flex size-full flex-col gap-2'}>
									<div
										{...getRootProps()}
										className={cl(
											'flex size-full h-80 items-center justify-center rounded-lg border border-dashed',
											isDragActive ? 'bg-neutral-300' : 'bg-neutral-400'
										)}>
										<div>
											<div className={'mb-2 flex justify-center'}>
												<IconUpload />
											</div>
											{getHint()}
										</div>
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
