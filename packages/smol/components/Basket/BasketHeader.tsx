import React, {Fragment} from 'react';
import Image from 'next/image';
import {ColoredRatioBar} from 'packages/smol/components/Basket/ColoredRatioBar';
import {type TBasketToken} from 'packages/smol/components/Basket/SwapBasket';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';

export function BasketHeader({
	toTokens,
	title,
	description
}: {
	toTokens: TBasketToken[];
	title: string;
	description: string;
}): ReactElement {
	return (
		<Fragment>
			{/* <div className={'mb-4 flex flex-wrap gap-2 text-xs'}>
				<Link href={'/baskets/facu'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'Facu'}</Button>
				</Link>
				<Link href={'/baskets/mom'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'MOM'}</Button>
				</Link>
				<Link href={'/baskets/stable'}>
					<Button className={'!h-8 py-1.5 !text-xs'}>{'Stable'}</Button>
				</Link>
			</div> */}
			<div className={'flex flex-row'}>
				{toTokens.map((item, index) => (
					<div
						key={item.token.address}
						className={cl('flex flex-col items-center', index === 0 ? '' : '-ml-5')}>
						<div className={'size-10 rounded-full border border-neutral-200'}>
							<Image
								src={item.token.logoURI || ''}
								alt={item.token.name}
								width={40}
								height={40}
							/>
						</div>
					</div>
				))}
			</div>
			<div className={'flex flex-row gap-4'}>
				<div
					className={cl(
						'grid aspect-square w-fit min-w-fit grid-cols-2 grid-rows-2 gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow',
						'hidden'
					)}>
					{toTokens.map(item => (
						<div
							key={item.token.address}
							className={'flex flex-col items-center'}>
							<div className={'size-12 rounded-full border border-neutral-200'}>
								<Image
									src={item.token.logoURI || ''}
									alt={item.token.name}
									width={96}
									height={96}
								/>
							</div>
						</div>
					))}
				</div>

				<div className={'grid w-full gap-4 py-2'}>
					<div>
						<b>{title}</b>
						<p className={'text-sm text-neutral-600'}>{description}</p>
					</div>
					<div className={'pt-0'}>
						<div className={cl('w-full overflow-hidden flex flex-row')}>
							{toTokens.map(item => (
								<div
									key={item.token.address}
									className={cl('h-full text-center text-sm font-medium text-neutral-700')}
									style={{width: `${item.share}%`}}>
									{item.token.symbol}
								</div>
							))}
						</div>
						<div
							className={cl(
								'h-4 w-full rounded-lg border border-neutral-200 bg-neutral-300',
								'relative overflow-hidden flex flex-row'
							)}>
							{toTokens.map(item => (
								<ColoredRatioBar
									key={item.token.address}
									logoURI={item.token.logoURI || ''}
									share={item.share}
								/>
							))}
						</div>
						<div className={cl('w-full overflow-hidden flex flex-row')}>
							{toTokens.map(item => (
								<div
									key={item.token.address}
									className={cl('h-full text-center text-sm font-medium text-neutral-700')}
									style={{width: `${item.share}%`}}>
									<div className={'text-xxs font-normal text-neutral-600'}>{` (${item.share}%)`}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
}
