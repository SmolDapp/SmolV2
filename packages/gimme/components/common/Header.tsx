import React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, truncateHex} from '@builtbymom/web3/utils';
import {Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTrigger} from '@gimmecommon/Drawer';
import {useAccountModal} from '@rainbow-me/rainbowkit';

import {IconMenu} from '../icons/IconMenu';

import type {ReactElement} from 'react';

function Header(): ReactElement {
	const pathname = usePathname();
	const {onConnect, onDesactivate, address, ens} = useWeb3();
	const {openAccountModal} = useAccountModal();

	const tabs = [{href: '/', label: 'Home', target: '_self'}];

	return (
		<header className={'mx-auto grid w-full max-w-6xl'}>
			<div className={'z-10 my-4 hidden w-full justify-between md:flex'}>
				<div className={'flex gap-x-6'}>
					{tabs.map(({href, label, target}) => (
						<Link
							key={href}
							href={href}
							target={target}>
							<p
								title={label}
								className={cl(
									'hover-fix text-center',
									(pathname.startsWith(href) && href !== '/') || pathname === href
										? 'font-bold text-neutral-900'
										: 'text-[#552E08] transition-all hover:text-neutral-900 hover:font-bold'
								)}>
								{label}
							</p>
						</Link>
					))}
				</div>
				<div className={''}>
					<button
						suppressHydrationWarning
						onClick={address ? openAccountModal : onConnect}
						className={'text-base font-bold'}>
						{address && ens ? ens : address ? truncateHex(address, 6) : 'Connect Wallet'}
					</button>
				</div>
			</div>
			<div className={'z-10 my-4 flex w-full justify-between px-2 md:hidden'}>
				<Drawer direction={'left'}>
					<DrawerTrigger>
						<IconMenu className={'size-6'} />
					</DrawerTrigger>
					<DrawerContent className={'bg-orange'}>
						<DrawerHeader>
							<button
								suppressHydrationWarning
								onClick={address ? onDesactivate : onConnect}
								className={
									'bg-yellow h-10 rounded-lg border-2 border-neutral-900 px-5 text-base font-bold'
								}>
								{address && ens ? ens : address ? truncateHex(address, 6) : 'Connect Wallet'}
							</button>
							<div className={'mt-6 grid gap-4 text-left'}>
								{tabs.map(({href, label, target}) => (
									<Link
										key={href}
										href={href}
										target={target}>
										<DrawerClose>
											<p
												className={cl(
													'text-left',
													pathname === href ? 'font-bold text-neutral-900' : 'text-[#552E08]'
												)}>
												{label}
											</p>
										</DrawerClose>
									</Link>
								))}
							</div>
						</DrawerHeader>
						<DrawerFooter>
							<DrawerClose>
								<button className={'text-xs text-neutral-900/60'}>{'Close'}</button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
				<div className={''}>
					<button
						suppressHydrationWarning
						onClick={address ? openAccountModal : onConnect}
						className={'text-base font-bold'}>
						{address && ens ? ens : address ? truncateHex(address, 6) : 'Connect Wallet'}
					</button>
				</div>
			</div>
		</header>
	);
}

export {Header};
