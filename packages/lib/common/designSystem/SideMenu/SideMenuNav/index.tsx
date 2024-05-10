import {cloneElement, Fragment, type ReactElement} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LinkOrDiv} from 'lib/common/LinkOrDiv';
import {IconAppAddressBook, IconAppDisperse, IconAppEarn, IconAppSend, IconAppStream} from 'lib/icons/IconApps';
import {IconWallet} from 'lib/icons/IconWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, isZeroAddress} from '@builtbymom/web3/utils';
import {useIsMounted} from '@hooks/useIsMounted';

const SIDE_MENU = [
	{
		href: '/apps/send',
		label: 'Send',
		icon: <IconAppSend />
	},
	{
		href: '/apps/disperse',
		label: 'Disperse',
		icon: <IconAppDisperse />
	},
	{
		href: '/apps/earn',
		label: 'Earn',
		isDisabled: true,
		icon: <IconAppEarn />
	},
	{
		href: '/apps/stream',
		label: 'Stream',
		isDisabled: true,
		icon: <IconAppStream />
	},
	{
		href: '/apps/address-book',
		label: 'Address Book',
		icon: <IconAppAddressBook />
	},
	{
		href: '/apps/wallet',
		label: 'Wallet',
		icon: <IconWallet />
	}
];

type TNavItemProps = {
	label: string;
	href: string;
	icon: ReactElement;
	isSelected: boolean;
	isDisabled?: boolean;
	onClick?: () => void;
};
function NavItem({label, href, icon, onClick, isSelected, isDisabled = false}: TNavItemProps): ReactElement {
	return (
		<li className={'relative z-10 px-4'}>
			<LinkOrDiv
				href={href}
				isDisabled={isDisabled}
				onClick={onClick}>
				<div
					className={cl(
						'flex items-center gap-2 justify-between rounded-3xl px-4 py-2 transition-colors w-full',
						'group',
						isSelected ? 'bg-neutral-300' : isDisabled ? '' : 'hover:bg-neutral-300',
						isDisabled ? 'cursor-not-allowed' : ''
					)}>
					<div className={'flex items-center gap-2 text-neutral-600'}>
						{cloneElement(icon, {
							className: cl(
								'h-4 w-4',
								isSelected
									? 'text-neutral-900 text-neutral-600'
									: isDisabled
										? 'text-neutral-400'
										: 'group-hover:text-neutral-900'
							)
						})}
						<p
							className={cl(
								'transition-colors',
								isSelected
									? 'text-neutral-900'
									: isDisabled
										? 'text-neutral-400'
										: 'group-hover:text-neutral-900'
							)}>
							{label}
						</p>
					</div>
					{isDisabled && (
						<span className={'text-xxs rounded-full bg-[#FFF3D3] px-2.5 py-0.5 text-center text-[#FF9900]'}>
							{'Soon'}
						</span>
					)}
				</div>
			</LinkOrDiv>
		</li>
	);
}

function LogOutButton(): ReactElement {
	const isMounted = useIsMounted();
	const {address, onDesactivate} = useWeb3();

	if (isZeroAddress(address) || !isMounted) {
		return <Fragment />;
	}

	return (
		<button
			className={'transition-colors hover:text-neutral-900'}
			onClick={onDesactivate}>
			{'Log out'}
		</button>
	);
}

export function SideMenuNav({onClose}: {onClose?: () => void}): ReactElement {
	const pathname = usePathname();

	return (
		<div className={'scrollable scrollbar-show h-full pt-4'}>
			<section className={'flex h-full flex-col justify-between'}>
				<ul className={'grid gap-2 pb-8'}>
					{SIDE_MENU.map(({href, label, icon, isDisabled}) => (
						<NavItem
							key={href}
							href={href}
							label={label}
							icon={icon}
							isDisabled={isDisabled}
							isSelected={pathname.startsWith(href)}
							onClick={onClose}
						/>
					))}
				</ul>
				<div className={'mt-auto px-4'}>
					<Link href={'https://dump.services/'}>
						<div
							className={
								'bg-neutral-0 group relative mb-2 flex w-full flex-col rounded-lg border border-neutral-400 p-2 opacity-60 transition-opacity hover:opacity-100'
							}>
							<p className={'pb-1 text-xs font-semibold text-neutral-700'}>{'Dump Services'}</p>
							<svg
								className={
									'absolute right-2 top-2 size-2.5 text-neutral-600 transition-colors group-hover:text-neutral-900'
								}
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}>
								<path
									fill={'currentcolor'}
									d={
										'M304 24c0 13.3 10.7 24 24 24H430.1L207 271c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l223-223V184c0 13.3 10.7 24 24 24s24-10.7 24-24V24c0-13.3-10.7-24-24-24H328c-13.3 0-24 10.7-24 24zM72 32C32.2 32 0 64.2 0 104V440c0 39.8 32.2 72 72 72H408c39.8 0 72-32.2 72-72V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V440c0 13.3-10.7 24-24 24H72c-13.3 0-24-10.7-24-24V104c0-13.3 10.7-24 24-24H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H72z'
									}
								/>
							</svg>
							<span className={'text-xs text-neutral-600'}>
								<span
									className={
										'text-primary-500 group-hover:text-primary-0 font-semibold transition-colors'
									}>
									{'Dump'}
								</span>
								{' your tokens like a pro'}
							</span>
						</div>
					</Link>
					<Link href={'https://multisafe.app/'}>
						<div
							className={
								'bg-neutral-0 group relative flex w-full flex-col rounded-lg border border-neutral-400 p-2 opacity-60 transition-opacity hover:opacity-100'
							}>
							<p className={'pb-1 text-xs font-semibold text-neutral-700'}>{'Multisafe'}</p>
							<svg
								className={
									'absolute right-2 top-2 size-2.5 text-neutral-600 transition-colors group-hover:text-neutral-900'
								}
								xmlns={'http://www.w3.org/2000/svg'}
								viewBox={'0 0 512 512'}>
								<path
									fill={'currentcolor'}
									d={
										'M304 24c0 13.3 10.7 24 24 24H430.1L207 271c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l223-223V184c0 13.3 10.7 24 24 24s24-10.7 24-24V24c0-13.3-10.7-24-24-24H328c-13.3 0-24 10.7-24 24zM72 32C32.2 32 0 64.2 0 104V440c0 39.8 32.2 72 72 72H408c39.8 0 72-32.2 72-72V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V440c0 13.3-10.7 24-24 24H72c-13.3 0-24-10.7-24-24V104c0-13.3 10.7-24 24-24H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H72z'
									}
								/>
							</svg>

							<span className={'text-xs text-neutral-600'}>
								{'One address, all the chains. Deploy your Safe across '}
								<span
									className={
										'text-primary-500 group-hover:text-primary-0 font-semibold transition-colors'
									}>
									{'multiple chains'}
								</span>
								{'.'}
							</span>
						</div>
					</Link>
					<div className={'text-xxs flex justify-between pb-2 pt-6 text-neutral-600'}>
						<div className={'flex gap-4'}>
							<Link
								className={'transition-colors hover:text-neutral-900'}
								href={'https://github.com/SmolDapp'}
								target={'_blank'}>
								{'GitHub'}
							</Link>
							<Link
								className={'transition-colors hover:text-neutral-900'}
								href={'https://twitter.com/smoldapp'}
								target={'_blank'}>
								{'Twitter'}
							</Link>
						</div>
						<LogOutButton />
					</div>
				</div>
			</section>
		</div>
	);
}
