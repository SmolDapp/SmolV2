import {
	IconAppAddressBook,
	IconAppDisperse,
	IconAppRevoke,
	IconAppSend,
	IconAppSwap
} from '@lib/components/icons/IconApps';
import {IconClone} from '@lib/components/icons/IconClone';
import IconMultisafe from '@lib/components/icons/IconMultisafe';
import IconSquarePlus from '@lib/components/icons/IconSquarePlus';
import {IconWallet} from '@lib/components/icons/IconWallet';
import {SideMenu} from '@lib/components/SideMenu';
import {SideMenuMobile} from '@lib/components/SideMenu/SideMenuMobile';
import {WithAddressBook} from '@lib/contexts/useAddressBook';
import AppHeading from 'app/(apps)/_appHeading';
import AppInfo from 'app/(apps)/_appInfo';

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
		<div className={'grid w-full grid-cols-root'}>
			<nav
				className={
					'sticky top-10 z-20 col-sidebar hidden h-app flex-col rounded-lg bg-neutral-0 md:ml-3 md:flex lg:ml-4 '
				}>
				<SideMenu menu={MENU} />
			</nav>

			<div className={'col-span-full mb-4 flex px-4 md:hidden'}>
				<SideMenuMobile menu={MENU} />
			</div>

			<div className={'col-span-full px-4 md:col-main md:px-3 lg:px-4'}>
				<div className={'relative mb-10 min-h-app w-full overflow-x-hidden rounded-lg bg-neutral-0'}>
					<WithAddressBook>
						<AppLayout>{props.children}</AppLayout>
					</WithAddressBook>
				</div>
			</div>
		</div>
	);
}
