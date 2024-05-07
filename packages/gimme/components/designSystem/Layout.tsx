import {type ReactElement, type ReactNode} from 'react';
import Link from 'next/link';
import {AnimatePresence, motion} from 'framer-motion';

import {ConnectButton} from './ConnectButton';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';
import type {NextRouter} from 'next/router';

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
		label: 'About'
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
						<Link
							className={'text-neutral-400 transition-colors hover:text-neutral-900'}
							href={item.href}>
							{item.label}
						</Link>
					))}
				</div>
				<ConnectButton />
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
