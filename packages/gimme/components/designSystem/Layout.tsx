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
	return <section className={'my-auto flex w-full justify-center px-2 pb-[130px]'}>{props.children}</section>;
}

type TComponent = NextComponentType & {
	getLayout: (p: ReactElement, router: NextRouter) => ReactElement;
};
export default function Layout(props: AppProps): ReactElement {
	const {Component, router} = props;
	const getLayout = (Component as TComponent).getLayout || ((page: ReactElement): ReactElement => page);

	return (
		<>
			<div className={'z-20 mx-10 mt-10 md:mx-auto md:w-full md:max-w-[864px]'}>
				<TopBar router={router} />
			</div>
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
		</>
	);
}
