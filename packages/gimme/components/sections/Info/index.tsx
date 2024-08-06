import Image from 'next/image';
import Link from 'next/link';
import {IconShare} from '@lib/icons/IconShare';

import type {ReactElement} from 'react';

export function InfoSection(): ReactElement {
	return (
		<div className={'pb-[300px] md:pb-0'}>
			<div
				className={
					'border-grey-200 mt-28 flex w-full max-w-[672px] flex-col gap-6 rounded-3xl border bg-white p-6 md:mt-0 md:p-14'
				}>
				<div className={'flex items-center justify-between'}>
					<Image
						className={'w-[240px] md:mt-2 md:w-[296px]'}
						src={'/info-title.svg'}
						width={296}
						height={48}
						alt={'info-title'}
					/>

					<Link
						href={'https://docs.yearn.fi/'}
						target={'_blank'}
						className={
							'text-grey-800 bg-grey-100 hover:bg-grey-200 hidden h-10 w-full max-w-[156px] items-center justify-center gap-3 rounded-2xl font-bold transition-colors md:flex'
						}>
						{"Yearn's Docs"}
						<IconShare className={'size-2'} />
					</Link>
				</div>
				<div className={'text-grey-700 text-md md:text-lg'}>
					<p>
						{
							"You know when you start a project and there's always that one task you leave till last (even if it's "
						}
						{'pretty important). Well for us… it was the about page.'}{' '}
					</p>
					<br />
					<p>
						{
							"So, we'll finish our homework while you check back soon. But until then, feel free to check out "
						}
						{"Yearn's docs (as the Yearn protocol provides all the yield opportunities on Gimme)."}
					</p>
				</div>

				<Link
					href={'https://docs.yearn.fi/'}
					target={'_blank'}
					className={
						'text-grey-800 bg-grey-100 hover:bg-grey-200 flex h-10 w-full items-center justify-between gap-3 rounded-2xl px-4 font-bold transition-colors md:hidden'
					}>
					{"Yearn's Docs"}
					<IconShare className={'size-2'} />
				</Link>
			</div>
		</div>
	);
}
