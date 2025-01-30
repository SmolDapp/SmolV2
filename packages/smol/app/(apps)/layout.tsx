import {SideMenu} from '@lib/common/SideMenu';
import {SideMenuMobile} from '@lib/common/SideMenu/SideMenuMobile';
import {WithAddressBook} from '@lib/contexts/useAddressBook';
import {IconAppAddressBook, IconAppDisperse, IconAppRevoke, IconAppSend, IconAppSwap} from '@lib/icons/IconApps';
import {IconClone} from '@lib/icons/IconClone';
import IconMultisafe from '@lib/icons/IconMultisafe';
import IconSquarePlus from '@lib/icons/IconSquarePlus';
import {IconWallet} from '@lib/icons/IconWallet';
import AppHeading from 'packages/smol/app/(apps)/_appHeading';
import AppInfo from 'packages/smol/app/(apps)/_appInfo';

import type {ReactElement, ReactNode} from 'react';

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
	// 	href: '/stream',
	// 	label: 'Stream',
	// 	isDisabled: true,
	// 	icon: <IconAppStream />
	// }
];

function AppLayout(props: {children: ReactNode}): ReactElement {
	return (
		<div>
			<div className={'flex w-full justify-end'}>
				<AppInfo />
			</div>
			<section className={'-mt-2 w-full p-4 md:p-8'}>
				<AppHeading />
				{props.children}
			</section>
		</div>
	);
}

export default async function RootLayout(props: {children: ReactElement}): Promise<ReactElement> {
	return (
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
				<div className={'min-h-app bg-neutral-0 relative mb-10 w-full overflow-x-hidden rounded-lg'}>
					<WithAddressBook>
						<AppLayout>{props.children}</AppLayout>
					</WithAddressBook>
				</div>
			</div>
		</div>
	);
}
