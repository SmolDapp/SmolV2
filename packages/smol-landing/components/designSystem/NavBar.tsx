import Link from 'next/link';

import type {ReactElement} from 'react';

export const TOP_NAV = [
	{
		href: '#',
		label: 'About'
	},
	{
		href: '#',
		label: 'Docs'
	},
	{
		href: 'https://twitter.com',
		label: 'Twitter'
	},
	{
		href: '#',
		label: 'Discord'
	}
];

export function NavBar(): ReactElement {
	return (
		<div className={'flex w-full items-center justify-center gap-x-6'}>
			{TOP_NAV.map(item => (
				<Link
					className={'font-semibold text-neutral-600 hover:text-neutral-900'}
					href={item.href}
					target={'_blank'}>
					{item.label}
				</Link>
			))}
		</div>
	);
}
