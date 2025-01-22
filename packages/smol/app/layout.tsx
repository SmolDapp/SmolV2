import '../style.css';

import {IconAppAddressBook, IconAppDisperse, IconAppRevoke, IconAppSend, IconAppSwap} from '@lib/icons/IconApps';
import {IconClone} from '@lib/icons/IconClone';
import IconMultisafe from '@lib/icons/IconMultisafe';
import IconSquarePlus from '@lib/icons/IconSquarePlus';
import {IconWallet} from '@lib/icons/IconWallet';
import {headers} from 'next/headers';
import {cookieToInitialState} from 'wagmi';

import {WithAddressBook} from '@smolContexts/useAddressBook';
import {config} from '@smolContexts/WithMom';
import Providers from 'packages/smol/app/Providers';
import {SideMenu} from 'packages/smol/common/SideMenu';
import {SideMenuMobile} from 'packages/smol/common/SideMenu/SideMenuMobile';

import type {ReactElement} from 'react';

const MENU = [
	{
		href: '/wallet',
		label: 'Wallet',
		icon: <IconWallet />
	},
	{
		href: '/send',
		label: 'Send',
		icon: <IconAppSend />
	},
	{
		href: '/disperse',
		label: 'Disperse',
		icon: <IconAppDisperse />
	},
	{
		href: '/swap',
		label: 'Swap/Bridge',
		icon: <IconAppSwap />
	},

	{
		href: '/address-book',
		label: 'Address Book',
		icon: <IconAppAddressBook />
	},
	{
		href: '/revoke',
		label: 'Revoke',
		icon: <IconAppRevoke />
	},
	{
		href: '/multisafe',
		label: 'Multisafe',
		icon: <IconMultisafe />,
		subMenu: [
			{
				href: '/multisafe/new-safe',
				label: 'Create a Safe',
				icon: <IconSquarePlus />
			},
			{
				href: '/multisafe/clone-safe',
				label: 'Clone a Safe',
				icon: <IconClone />
			}
		]
	}
	// {
	// 	href: '/earn',
	// 	label: 'Earn',
	// 	isDisabled: true,
	// 	icon: <IconAppEarn />
	// },
	// {
	// 	href: '/stream',
	// 	label: 'Stream',
	// 	isDisabled: true,
	// 	icon: <IconAppStream />
	// }
];

export default async function RootLayout(props: {children: ReactElement}): Promise<ReactElement> {
	const initialState = cookieToInitialState(config, (await headers()).get('cookie'));

	return (
		<html
			lang={'en'}
			className={'scrollbar-none'}
			suppressHydrationWarning>
			<head>
				<link
					rel={'preconnect'}
					href={'https://fonts.googleapis.com'}
				/>
				<link
					rel={'preconnect'}
					href={'https://fonts.gstatic.com'}
					crossOrigin={'anonymous'}
				/>
			</head>
			<body className={'bg-neutral-200 font-sans transition-colors duration-150'}>
				<main className={'h-app flex flex-col'}>
					<Providers initialState={initialState}>
						<div className={'mx-auto mt-10 w-full max-w-6xl'}>
							<div className={'grid-cols-root grid w-full'}>
								<nav
									className={
										'col-sidebar h-app bg-neutral-0 sticky top-10 z-20 hidden flex-col rounded-lg md:ml-3 md:flex lg:ml-4 '
									}>
									<SideMenu menu={MENU} />
								</nav>

								<div className={'col-span-full mb-4 flex px-4 md:hidden'}>
									<SideMenuMobile menu={MENU} />
								</div>

								<div className={'md:col-main col-span-full px-4 md:px-3 lg:px-4'}>
									<div
										className={
											'min-h-app bg-neutral-0 relative mb-10 w-full overflow-x-hidden rounded-lg'
										}>
										<WithAddressBook>{props.children}</WithAddressBook>
									</div>
								</div>
							</div>
						</div>
					</Providers>
				</main>
			</body>
		</html>
	);
}
