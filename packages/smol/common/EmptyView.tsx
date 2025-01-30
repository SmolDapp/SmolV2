import {IconWallet} from '@lib/icons/IconWallet';

import type {ReactElement} from 'react';

export function EmptyView({onConnect}: {onConnect?: () => Promise<void>}): ReactElement {
	return (
		<div className={'mt-4 flex size-full h-full flex-col items-center rounded-lg bg-neutral-200 px-11 py-[72px]'}>
			<div className={'bg-neutral-0 mb-6 flex size-40 items-center justify-center rounded-full'}>
				<div className={'relative flex size-40 items-center justify-center rounded-full bg-white'}>
					<IconWallet className={'size-20'} />
				</div>
			</div>
			{onConnect ? (
				<div className={'flex flex-col items-center justify-center'}>
					<p className={'text-center text-base text-neutral-600'}>
						{'Get started by connecting your wallet'}
					</p>
					<div className={'max-w-23 mt-6 w-full'}>
						<button
							onClick={() => {
								onConnect();
							}}
							className={
								'bg-primary hover:bg-primaryHover h-8 w-full rounded-lg text-xs transition-colors'
							}>
							{'Connect Wallet'}
						</button>
					</div>
				</div>
			) : (
				<p className={'text-center text-base text-neutral-600'}>
					{
						"Oh no, we can't find your tokens. You can paste a token address above or... you know... buy some tokens."
					}
				</p>
			)}
		</div>
	);
}
