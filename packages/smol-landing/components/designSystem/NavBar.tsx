import Link from 'next/link';

import type {ReactElement} from 'react';

export const TOP_NAV = [
	{
		href: '/',
		label: 'About'
	},
	{
		href: 'https://smold.app/',
		label: 'App'
	},
	{
		href: 'https://x.com/built_by_mom',
		label: 'Twitter'
	},
	{
		href: 'https://github.com/SmolDapp/SmolV2',
		label: 'Github'
	}
];

export function NavBar(): ReactElement {
	return (
		<div className={'flex w-full items-center justify-center gap-x-6'}>
			{TOP_NAV.map(item => (
				<Link
					key={item.label}
					className={'font-semibold text-neutral-600 hover:text-neutral-900'}
					href={item.href}
					target={item.label === 'About' ? '_self' : '_blank'}>
					{item.label}
				</Link>
			))}
		</div>
	);
}
