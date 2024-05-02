import {cl} from '@builtbymom/web3/utils';
import {IconCheck} from '@icons/IconCheck';
import {IconLoader} from '@icons/IconLoader';
import {NProgress} from '@tanem/react-nprogress';

import type {ReactElement} from 'react';
import type {Toast} from 'react-hot-toast';

export function ProgressToasts(props: {
	t: Toast;
	sendingTokenSymbol: string;
	receivingTokenSymbol: string;
	animationDuration: number;
	expectedEnd: string;
	message?: string;
	isCompleted: boolean;
}): ReactElement {
	return (
		<div
			style={{boxShadow: '0 4px 12px #0000001a'}}
			className={cl(
				'mb-4 rounded-lg border border-neutral-300 bg-white p-4',
				'w-108 flex flex-row gap-2',
				props.t.visible ? 'animate-enter' : 'animate-leave'
			)}>
			{props.isCompleted ? (
				<div className={'mt-0.5 flex size-4 items-center justify-center rounded-full bg-primary'}>
					<IconCheck className={'size-3.5 text-white'} />
				</div>
			) : (
				<IconLoader className={'mt-0.5 size-4 animate-spin text-neutral-600'} />
			)}
			<div className={'grid'}>
				<span className={'text-sm text-neutral-800'}>
					{'Swapping'}&nbsp;
					<b className={'font-semibold'}>{props.sendingTokenSymbol}</b>
					&nbsp;{'for'}&nbsp;
					<b className={'font-semibold'}>{props.receivingTokenSymbol}</b>
				</span>
				<div className={'pb-2 text-sm text-neutral-600'}>
					<p>{'The blockchain is processing your swap!'}</p>
					<p>
						{'Based on LIFI, it should be completed around'}
						&nbsp;
						<b>{props.expectedEnd}</b>
						{'.'}
					</p>
					<p>{props.message ? props.message : null}</p>
				</div>
				<NProgress
					isAnimating={props.isCompleted ? false : true}
					animationDuration={props.animationDuration || 1000}>
					{({animationDuration, progress}) => (
						<div className={'relative h-2 w-full overflow-hidden rounded-lg bg-neutral-300'}>
							<div
								className={'absolute inset-y-0 left-0 size-full bg-primary'}
								style={{
									marginLeft: `${(-1 + progress) * 100}%`,
									transition: `margin-left ${animationDuration}ms linear`,
									zIndex: 1031
								}}
							/>
						</div>
					)}
				</NProgress>
			</div>
		</div>
	);
}
