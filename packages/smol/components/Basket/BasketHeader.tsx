import React, {Fragment} from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
			<div className={'flex flex-col gap-6'}>
				<div>
					<div className={'flex items-center gap-2'}>
						<Link
							href={'/apps/baskets'}
							className={'flex items-center gap-2 text-neutral-700'}>
							<span className={'text-sm'}>{'Baskets'}</span>
						</Link>
						<div className={'text-sm text-neutral-600'}>{'>'}</div>
						<div className={'text-sm text-neutral-600'}>{title}</div>
					</div>
				</div>

				<div className={'grid w-full gap-4 py-2'}>
					<div className={'flex items-center gap-4'}>
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
						<div>
							<b>{title}</b>
							<p className={'text-sm text-neutral-600'}>{description}</p>
						</div>
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
						<div className={cl('h-4 w-full', 'relative overflow-hidden flex flex-row gap-1')}>
							{toTokens.map(item => (
								<div
									className={'relative h-4'}
									style={{width: `${item.share}%`}}
									key={item.token.address}>
									<ColoredRatioBar
										logoURI={item.token.logoURI || ''}
										share={100}
									/>
								</div>
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
