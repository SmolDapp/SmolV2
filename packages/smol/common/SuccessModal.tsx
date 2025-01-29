'use client';

import {IconCheck} from '@lib/icons/IconCheck';
import {Button} from '@lib/primitives/Button';
import {cl} from '@lib/utils/helpers';
import {useUpdateEffect} from '@react-hookz/web';
import Link from 'next/link';
import {useMemo, useState} from 'react';

import {ModalWrapper} from './ModalWrapper';

import type {ReactElement} from 'react';

type TSuccessModal = {
	isOpen: boolean;
	onClose: VoidFunction;
	title: string;
	content: ReactElement | string;
	ctaLabel: string;
	className?: string;
	downloadConfigButton?: ReactElement;
	twitterShareContent?: string;
};
function SuccessModal(props: TSuccessModal): ReactElement {
	const [shouldTriggerConfettis, setShouldTriggerConfettis] = useState(false);

	const tweetURL = useMemo(() => {
		if (props.twitterShareContent) {
			return `http://twitter.com/share?text=${props.twitterShareContent}&url=https://smold.app`;
		}
		return '';
	}, [props.twitterShareContent]);

	useUpdateEffect((): void => {
		if (props.isOpen) {
			setTimeout((): void => setShouldTriggerConfettis(true), 300);
		} else {
			setShouldTriggerConfettis(false);
		}
	}, [props.isOpen]);

	return (
		<ModalWrapper
			isOpen={props.isOpen}
			onClose={props.onClose}
			shouldTriggerConfettis={shouldTriggerConfettis}
			className={'!max-w-lg'}>
			<>
				<div className={'bg-green flex w-full items-center justify-center'}>
					<div className={'my-6 rounded-full bg-white p-4'}>
						<IconCheck className={'text-green size-10'} />
					</div>
				</div>
				<div className={'w-full px-10 pt-10'}>
					<h3 className={'text-primary-900 text-center text-3xl font-bold leading-6'}>{props.title}</h3>
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
							className={cl('!h-10 w-full', props.twitterShareContent ? 'col-span-1' : 'col-span-2')}
							variant={'light'}
							onClick={props.onClose}>
							{props.ctaLabel}
						</Button>
					</div>
				</div>
			</>
		</ModalWrapper>
	);
}
export {SuccessModal};
