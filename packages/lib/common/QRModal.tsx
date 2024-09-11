import {type ReactElement, useCallback} from 'react';
import toast from 'react-hot-toast';
import {toAddress} from '@builtbymom/web3/utils';
import {cl} from '@builtbymom/web3/utils/cl';
import {IconClone} from '@lib/icons/IconClone';

import {ModalWrapper} from './ModalWrapper';

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
		<ModalWrapper
			isOpen={props.isOpen}
			onClose={props.onClose}
			shouldDisplayHeader={true}
			title={props.title}>
			<>
				<div>
					<div className={'text-center'}>
						<div className={'mt-3 md:mt-6'}>
							<p className={'mb-10 text-neutral-900/80'}>{props.content}</p>
							<div className={'flex w-full justify-center'}>{props.children}</div>
						</div>
					</div>
				</div>
				<div className={'flex flex-col gap-2 pt-10'}>
					<div className={'m-0 flex flex-col items-center'}>
						<p className={'mb-1 text-xs text-neutral-600 md:text-base'}>{'Wallet address'}</p>
						<button
							className={cl('text-xs flex items-center mt-1', 'text-neutral-900 transition-colors')}
							onClick={onCopyAddress}>
							<p className={'md:text-md mr-1 text-xs text-neutral-900 sm:text-sm'}>{props.address}</p>
							<IconClone className={'size-3 md:size-4'} />
						</button>
					</div>
				</div>
			</>
		</ModalWrapper>
	);
};

export {QRModal};
