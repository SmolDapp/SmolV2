import {IconCross} from '@lib/icons/IconCross';
import {motion} from 'framer-motion';
import Link from 'next/link';

import {TOP_NAV} from './NavBar';

import type {ReactElement} from 'react';

export const MobileNavBar = ({setIsNavBarOpen}: {setIsNavBarOpen: (value: boolean) => void}): ReactElement => {
	return (
		<div className={'z-20 min-h-screen w-screen max-w-full'}>
			<motion.nav className={'flex flex-wrap items-center justify-between px-6 lg:px-12'}>
				<div className={'flex w-full justify-between'}>
					<div className={'flex flex-col gap-y-4'}>
						{TOP_NAV.map(item => (
							<Link
								href={item.href}
								key={item.label}>
								{item.label}
							</Link>
						))}
					</div>
					<div>
						<button onClick={() => setIsNavBarOpen(false)}>
							<IconCross className={'size-6'} />
						</button>
					</div>
				</div>
			</motion.nav>
		</div>
	);
};
