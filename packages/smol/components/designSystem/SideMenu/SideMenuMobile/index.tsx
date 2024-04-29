import {Fragment, useState} from 'react';
import {NetworkPopoverSelector} from 'components/designSystem/NetworkSelector/Popover';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, isAddress} from '@builtbymom/web3/utils';
import {Dialog, Transition} from '@headlessui/react';
import {IconHamburger} from '@icons/IconHamburger';
import {useIsMounted} from '@react-hookz/web';

import {SideMenuFooter} from '../SideMenuFooter';
import {SideMenuNav} from '../SideMenuNav';
import {CoinBalance} from '../SideMenuProfile/CoinBalance';
import {ConnectButton} from '../SideMenuProfile/ConnectButton';
import {ProfileBox} from '../SideMenuProfile/ProfileBox';
import {SkeletonPlaceholder} from '../SideMenuProfile/SkeletonPlaceholder';

import type {ReactElement} from 'react';

function SideMenuProfileMobile({onOpen}: {onOpen: () => void}): ReactElement {
	const {address} = useWeb3();

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

export function SideMenuMobile(): ReactElement {
	const [isOpen, set_isOpen] = useState(false);
	const isMounted = useIsMounted();

	if (!isMounted()) {
		return (
			<div className={'w-full'}>
				<SkeletonPlaceholder />
			</div>
		);
	}

	return (
		<>
			<SideMenuProfileMobile onOpen={() => set_isOpen(true)} />
			<Transition.Root
				show={isOpen}
				as={Fragment}>
				<Dialog
					as={'div'}
					className={'relative z-[1000] block w-full md:hidden'}
					onClose={() => set_isOpen(!isOpen)}>
					<Transition.Child
						as={Fragment}
						enter={'ease-in duration-300'}
						enterFrom={'translate-y-full opacity-0'}
						enterTo={'translate-y-0 opacity-100'}
						leave={'ease-out duration-300'}
						leaveFrom={'translate-y-0 opacity-100'}
						leaveTo={'translate-y-full opacity-0'}>
						<div className={'fixed inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity'} />
					</Transition.Child>

					<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
						<div
							className={
								'flex min-h-full items-end justify-center p-0 text-center md:items-center md:p-0'
							}>
							<Transition.Child
								as={Fragment}
								enter={'ease-in duration-300'}
								enterFrom={'translate-y-full opacity-0'}
								enterTo={'translate-y-0 opacity-100'}
								leave={'ease-out duration-300'}
								leaveFrom={'translate-y-0 opacity-100'}
								leaveTo={'translate-y-full opacity-0'}>
								<Dialog.Panel
									className={cl(
										'relative overflow-hidden rounded-md !bg-neutral-0 transition-all w-full'
									)}>
									<SideMenuNav onClose={() => set_isOpen(false)} />
									<SideMenuFooter />
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition.Root>
		</>
	);
}
