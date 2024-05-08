import React from 'react';
import {ImageWithFallback} from 'packages/lib/common/ImageWithFallback';
import {IconChevron} from 'packages/lib/icons/IconChevron';
import {cl} from '@builtbymom/web3/utils';

export function SelectOpportunityButton(): JSX.Element {
	// const {onOpenCurtain} = useBalancesCurtain();
	const isSelected = true;
	return (
		<div className={'relative size-full'}>
			<div
				className={cl(
					'h-20 z-20 relative border transition-all',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'p-2 group bg-neutral-0 rounded-[8px]',
					'border-neutral-400'
				)}>
				<button
					className={cl(
						'flex items-center justify-between gap-2 rounded-[4px] py-2 pl-4 pr-2 w-full h-full',
						'transition-colors',
						isSelected ? 'bg-neutral-200 hover:bg-neutral-300' : 'bg-primary hover:bg-primaryHover'
					)}
					// onClick={() =>
					// 	onOpenCurtain(token => {
					// 		onSelectOpportunity(token);
					// 	})
					// }
				>
					{isSelected ? (
						<>
							<div className={'flex w-full items-center gap-2'}>
								<div
									className={
										'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'
									}>
									<ImageWithFallback
										alt={'S'}
										unoptimized
										src={'opportunity.png'}
										quality={90}
										width={40}
										height={40}
									/>
								</div>
								<p className={'break-normal text-left font-bold'}>
									{'USDT Optimism v2 very long name'}
								</p>
							</div>
							<div className={'bg-primary w-full max-w-20 rounded-md p-1 text-xs font-bold'}>
								{'APY 14.67%'}
							</div>
							<IconChevron className={'size-4 min-w-4 text-neutral-600'} />
						</>
					) : (
						<div className={'flex size-full flex-col items-center'}>
							<p className={'font-bold'}>{'Select Opportunity'}</p>
							<p className={'text-xs'}>{'Earn up to 0.45% APY'}</p>
						</div>
					)}
				</button>
			</div>
		</div>
	);
}
