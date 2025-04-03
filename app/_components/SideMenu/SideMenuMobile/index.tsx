'use client';

import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';
import {Fragment, useState} from 'react';
import {useAccount} from 'wagmi';

import {IconHamburger} from '@lib/components/icons/IconHamburger';
import {NetworkPopoverSelector} from '@lib/components/NetworkSelector/Popover';
import {SideMenuFooter} from '@lib/components/SideMenu/SideMenuFooter';
import {SideMenuNav} from '@lib/components/SideMenu/SideMenuNav';
import {CoinBalance} from '@lib/components/SideMenu/SideMenuProfile/CoinBalance';
import {ConnectButton} from '@lib/components/SideMenu/SideMenuProfile/ConnectButton';
import {ProfileBox} from '@lib/components/SideMenu/SideMenuProfile/ProfileBox';
import {SkeletonPlaceholder} from '@lib/components/SideMenu/SideMenuProfile/SkeletonPlaceholder';
import {useIsMounted} from '@lib/hooks/useIsMounted';
import {cl} from '@lib/utils/helpers';
import {isAddress} from '@lib/utils/tools.addresses';

import type {TSideMenuItem} from '@lib/components/SideMenu/SideMenuNav';
import type {ReactElement} from 'react';

function SideMenuProfileMobile({onOpen}: {onOpen: () => void}): ReactElement {
	const {address} = useAccount();

	if (!isAddress(address)) {
		return (
			<div className={'relative w-full'}>
				<ConnectButton />
				<button
					className={'absolute right-6 top-4 z-50 rounded-full p-2 transition-colors hover:bg-neutral-200'}
					onClick={onOpen}>
					<IconHamburger className={'size-4'} />
				</button>
			</div>
		);
	}
	return (
		<div className={cl('py-4 pl-4 pr-6 bg-neutral-0 w-full rounded-lg')}>
			<div className={'mb-4 flex items-center justify-between'}>
				<ProfileBox />
				<button
					className={'rounded-full p-2 transition-colors hover:bg-neutral-200'}
					onClick={onOpen}>
					<IconHamburger className={'size-4'} />
				</button>
			</div>
			<div className={'flex items-center justify-between gap-6'}>
				<div>
					<small>{'Chain'}</small>
					<NetworkPopoverSelector />
				</div>
				<div className={'text-end'}>
					<CoinBalance />
				</div>
			</div>
		</div>
	);
}

export function SideMenuMobile(props: {menu?: TSideMenuItem[]}): ReactElement {
	const [isOpen, setIsOpen] = useState(false);
	const isMounted = useIsMounted();

	if (!isMounted) {
		return (
			<div className={'w-full'}>
				<SkeletonPlaceholder />
			</div>
		);
	}

	return (
		<>
			<SideMenuProfileMobile onOpen={() => setIsOpen(true)} />
			<Transition
				show={isOpen}
				as={Fragment}>
				<Dialog
					as={'div'}
					className={'relative z-[1000] block w-full md:hidden'}
					onClose={() => setIsOpen(!isOpen)}>
					<TransitionChild
						as={Fragment}
						enter={'ease-in duration-300'}
						enterFrom={'translate-y-full opacity-0'}
						enterTo={'translate-y-0 opacity-100'}
						leave={'ease-out duration-300'}
						leaveFrom={'translate-y-0 opacity-100'}
						leaveTo={'translate-y-full opacity-0'}>
						<div className={'fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity'} />
					</TransitionChild>

					<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
						<div
							className={
								'flex min-h-full items-end justify-center p-0 text-center md:items-center md:p-0'
							}>
							<TransitionChild
								as={Fragment}
								enter={'ease-in duration-300'}
								enterFrom={'translate-y-full opacity-0'}
								enterTo={'translate-y-0 opacity-100'}
								leave={'ease-out duration-300'}
								leaveFrom={'translate-y-0 opacity-100'}
								leaveTo={'translate-y-full opacity-0'}>
								<DialogPanel
									className={cl(
										'relative overflow-hidden rounded-md !bg-neutral-0 transition-all w-full'
									)}>
									<SideMenuNav
										menu={props.menu}
										onClose={() => setIsOpen(false)}
									/>
									<SideMenuFooter />
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
