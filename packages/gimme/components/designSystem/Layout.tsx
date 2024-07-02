import {type ReactElement, type ReactNode} from 'react';
import {type NextRouter} from 'next/router';
import {AnimatePresence, motion} from 'framer-motion';

import {TopBar} from './TopBar';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';

type TAppProp = {
	children: ReactNode;
};

function App(props: TAppProp): ReactElement {
	return <section className={'mt-24 flex w-full justify-center px-2'}>{props.children}</section>;
}

type TComponent = NextComponentType & {
	getLayout: (p: ReactElement, router: NextRouter) => ReactElement;
};
export default function Layout(props: AppProps): ReactElement {
	const {Component, router} = props;
	const getLayout = (Component as TComponent).getLayout || ((page: ReactElement): ReactElement => page);

	return (
		<div className={'mx-auto mt-10 max-w-5xl'}>
			{/* <div className={'grid grid-cols-2 px-2 md:grid-cols-3'}>
				<div className={'flex items-center gap-4'}>
					<div className={'size-10 rounded-full bg-black'} />
					<div className={'font-bold'}>{'GIMME'}</div>
				</div>
				<NavBar router={router} />
				<div className={'flex justify-end gap-2'}>
					<NetworkPopoverSelector networks={[polygon]} />
					<ConnectButton />
				</div>
			</div> */}
			<TopBar router={router} />
			<App>
				<AnimatePresence>
					<motion.div
						className={'flex w-full justify-center'}
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
