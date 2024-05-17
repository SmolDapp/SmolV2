import {type ReactElement, type ReactNode} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {cl} from '@builtbymom/web3/utils';
import {InfoCurtain} from '@lib/common/Curtains/InfoCurtain';
import {SideMenu} from '@lib/common/SideMenu';
import {SideMenuMobile} from '@lib/common/SideMenu/SideMenuMobile';
import {WithAddressBook} from '@lib/contexts/useAddressBook';
import {IconQuestionMark} from '@lib/icons/IconQuestionMark';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';
import type {TSideMenuItem} from './SideMenu/SideMenuNav';

type TAppProp = {
	title: string;
	description: string;
	children: ReactNode;
	info: string;
};
function App(props: TAppProp): ReactElement {
	return (
		<div>
			<div className={'flex w-full justify-end'}>
				<InfoCurtain
					trigger={
						<div
							className={cl(
								'size-4 md:size-8 rounded-full absolute right-4 top-4',
								'bg-neutral-200 transition-colors hover:bg-neutral-300',
								'flex justify-center items-center'
							)}>
							<IconQuestionMark className={'size-6 text-neutral-600'} />
						</div>
					}
					info={props.info}
				/>
			</div>
			<section className={'-mt-2 w-full p-4 md:p-8'}>
				<div className={'md:max-w-108 mb-6 flex w-full flex-row justify-between'}>
					<div>
						<h1
							className={
								'pr-6 text-2xl font-bold text-neutral-900 md:whitespace-nowrap md:pr-0 md:text-3xl'
							}>
							{props.title}
						</h1>
						<p className={'pt-2 text-base text-neutral-600 md:pt-1'}>{props.description}</p>
					</div>
				</div>
				{props.children}
			</section>
		</div>
	);
}

type TComponent = NextComponentType & {
	AppName: string;
	AppDescription: string;
	AppInfo: string;
};
export default function Layout(props: AppProps & {menu?: TSideMenuItem[]}): ReactElement {
	const {Component, router} = props;
	const appName = (Component as TComponent).AppName || 'App';
	const appDescription = (Component as TComponent).AppDescription || '';
	const appInfo = (Component as TComponent).AppInfo || '';

	return (
		<div className={'mx-auto mt-10 w-full max-w-6xl'}>
			<div className={'grid-cols-root grid w-full'}>
				<motion.nav
					initial={{scale: 0.9, opacity: 0}}
					animate={{scale: 1, opacity: 1}}
					transition={{duration: 0.6, ease: 'easeInOut'}}
					className={'col-sidebar h-app bg-neutral-0 sticky top-10 z-20 hidden flex-col rounded-lg md:flex'}>
					<SideMenu menu={props.menu} />
				</motion.nav>

				<div className={'col-span-full mb-4 flex px-4 md:hidden'}>
					<SideMenuMobile menu={props.menu} />
				</div>

				<div className={'md:col-main col-span-full px-4 '}>
					<div className={'min-h-app bg-neutral-0 relative mb-10 w-full overflow-x-hidden rounded-lg'}>
						<WithAddressBook>
							<App
								key={router.pathname}
								title={appName}
								description={appDescription}
								info={appInfo}>
								<AnimatePresence>
									<motion.div
										key={router.route}
										initial={{scale: 0.9, opacity: 0}}
										animate={{scale: 1, opacity: 1}}
										transition={{
											delay: router.isReady ? 0.2 : 0.4,
											duration: 0.6,
											ease: 'easeInOut'
										}}>
										<Component {...props} />
									</motion.div>
								</AnimatePresence>
							</App>
						</WithAddressBook>
					</div>
				</div>
			</div>
		</div>
	);
}
