import {cl} from '@builtbymom/web3/utils';
import {IconErrorTriangle} from '@lib/icons/IconErrorTriangle';
import {Button} from '@lib/primitives/Button';

import {ModalWrapper} from './ModalWrapper';

import type {ReactElement} from 'react';

type TErrorModal = {
	isOpen: boolean;
	onClose: VoidFunction;
	title: string;
	content: string;
	ctaLabel: string;
	type?: 'hard' | 'soft';
};

export function ErrorModal({isOpen, onClose, title, content, ctaLabel, type = 'hard'}: TErrorModal): ReactElement {
	return (
		<ModalWrapper
			isOpen={isOpen}
			onClose={onClose}
			className={'!max-w-lg'}>
			<>
				<div className={cl('mb-10 p-7 rounded-full', type === 'soft' ? 'bg-primary' : 'bg-red')}>
					<IconErrorTriangle className={'size-6 text-white'} />
				</div>

				<div>
					<div className={'text-center'}>
						<h3 className={'text-primary-900 text-3xl font-bold leading-6'}>{title}</h3>
						<div className={'mt-6'}>
							<p className={'text-neutral-900/80'}>{content}</p>
						</div>
					</div>
				</div>
				<div className={'flex w-[200px] flex-col items-center justify-center gap-2 pt-10 text-center'}>
					<Button
						className={'w-full'}
						onClick={onClose}>
						{ctaLabel}
					</Button>
				</div>
			</>
		</ModalWrapper>
	);
}
