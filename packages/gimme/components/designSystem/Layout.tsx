import {type ReactElement, type ReactNode} from 'react';
import {type NextRouter} from 'next/router';
import {LinkOrDiv} from 'lib/common/LinkOrDiv';
import {AnimatePresence, motion} from 'framer-motion';
import {cl} from '@builtbymom/web3/utils';

import {ConnectButton} from './ConnectButton';
import {NetworkPopoverSelector} from './NetworkPopoverSelector';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';

const TOP_NAV = [
	{
		href: '/earn',
		label: 'Earn'
	},
	{
		href: '/portfolio',
		label: 'Portfolio',
		isDisabled: true
	},
	{
		href: '/about',
		label: 'About',
		isDisabled: true
	}
];

type TAppProp = {
	children: ReactNode;
};

function App(props: TAppProp): ReactElement {
	return <section className={'mt-24 flex w-full justify-center'}>{props.children}</section>;
}

type TComponent = NextComponentType & {
	getLayout: (p: ReactElement, router: NextRouter) => ReactElement;
};
export default function Layout(props: AppProps): ReactElement {
	const {Component, router} = props;
	const getLayout = (Component as TComponent).getLayout || ((page: ReactElement): ReactElement => page);

	return (
		<div className={'mx-auto mt-10 w-full max-w-6xl'}>
			<div className={'flex items-center justify-between'}>
				<div className={'flex items-center gap-4'}>
					<div className={'size-10 rounded-full bg-black'} />
					<div className={'font-bold'}>{'GIMME'}</div>
				</div>
				<div className={'flex gap-6 font-bold'}>
					{TOP_NAV.map(item => (
						<LinkOrDiv
							key={item.label}
							className={cl(
								'text-neutral-400 transition-colors',
								!item.isDisabled ? 'hover:text-neutral-900' : '',
								router.pathname === item.href ? 'text-neutral-900' : ''
							)}
							href={item.href}
							isDisabled={item.isDisabled}>
							{item.label}
						</LinkOrDiv>
					))}
				</div>
				<div className={'flex gap-2'}>
					<NetworkPopoverSelector />
					<ConnectButton />
				</div>
			</div>
			<App>
				<AnimatePresence>
					<motion.div
						initial={{scale: 0.9, opacity: 0}}
						animate={{scale: 1, opacity: 1}}
						transition={{
							delay: router.isReady ? 0.2 : 0.4,
							duration: 0.6,
							ease: 'easeInOut'
						}}>
						{getLayout(<Component {...props} />, router)}
					</motion.div>
				</AnimatePresence>
			</App>
		</div>
	);
}
