import {cl} from '@builtbymom/web3/utils';
import {LinkOrDiv} from '@lib/common/LinkOrDiv';

import type {Router} from 'next/router';
import type {ReactElement} from 'react';

const TOP_NAV = [
	{
		href: '/earn',
		label: 'Earn'
	},
	{
		href: '/portfolio',
		label: 'Portfolio'
	},
	{
		href: '/about',
		label: 'About',
		isDisabled: true
	}
];

export function NavBar(props: {router: Router}): ReactElement {
	return (
		<>
			<div className={'hidden items-center justify-center gap-6 font-bold md:flex'}>
				{TOP_NAV.map(item => (
					<LinkOrDiv
						key={item.label}
						className={cl(
							'text-neutral-400 transition-colors',
							!item.isDisabled ? 'hover:text-neutral-900' : '',
							props.router.pathname === item.href ? 'text-neutral-900' : ''
						)}
						href={item.href}
						isDisabled={item.isDisabled}>
						{item.label}
					</LinkOrDiv>
				))}
			</div>
			<div
				className={
					'fixed bottom-6 left-1/2 grid w-full max-w-72 -translate-x-1/2 grid-cols-3 rounded-2xl bg-white p-1 md:hidden'
				}>
				{TOP_NAV.map(item => (
					// <button
					// 	className={'col-span-1 rounded-xl px-2 py-4 leading-5 transition-colors hover:bg-neutral-300'}>
					// 	{item.label}
					// </button>
					<LinkOrDiv
						key={item.label}
						className={cl(
							'rounded-xl text-center px-2 py-4 leading-5 transition-colors text-neutral-600 font-bold',
							!item.isDisabled ? 'hover:text-neutral-900 hover:bg-neutral-300' : ''
						)}
						href={item.href}
						isDisabled={item.isDisabled}>
						{item.label}
					</LinkOrDiv>
				))}
			</div>
		</>
	);
}
