import {ImageWithFallback} from 'lib/common/ImageWithFallback';
import {IconQuestionMark} from 'lib/icons/IconQuestionMark';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';

function OpportunityStats({value}: {value: 'low' | 'medium' | 'high'}): ReactElement {
	return (
		<div className={'flex items-end gap-[6px]'}>
			<div className={'h-[9px] w-[3px] rounded-sm bg-neutral-900'} />
			<div
				className={cl('h-[15px] w-[3px] rounded-sm bg-neutral-900', value === 'low' ? '!bg-neutral-600' : '')}
			/>
			<div
				className={cl(
					'h-[21px] w-[3px] rounded-sm bg-neutral-900',
					value === 'medium' || value === 'low' ? '!bg-neutral-600' : ''
				)}
			/>
		</div>
	);
}

export function Opportunity(): ReactElement {
	return (
		<div
			className={
				'flex w-full cursor-pointer justify-between rounded-md px-4 py-3 transition-colors hover:bg-neutral-200'
			}>
			<div className={'flex items-center gap-4'}>
				<ImageWithFallback
					alt={'S'}
					unoptimized
					src={'opportunity.png'}
					quality={90}
					width={32}
					height={32}
				/>
				<div className={'flex flex-col items-start gap-0.5'}>
					<p>{'DAI Savings Rate'}</p>
					<div className={'flex items-start gap-1'}>
						<p className={'text-xs text-[#AF9300]'}>{'+ $270 over 1y'}</p>
						<div className={'text-xxs rounded-sm bg-neutral-400 px-1 text-neutral-700'}>
							{'DAI -> USDT'}
						</div>
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<p className={'mr-6 text-lg font-medium'}>{'6.78%'}</p>
				<OpportunityStats value={'medium'} />
				<button className={'ml-4'}>
					<IconQuestionMark className={'size-6 text-neutral-600'} />
				</button>
			</div>
		</div>
	);
}
