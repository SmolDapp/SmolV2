import {cloneElement, Fragment, type ReactElement, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import {motion} from 'framer-motion';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, isZeroAddress} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';
import {useIsMounted} from '@smolHooks/useIsMounted';
import {LinkOrDiv} from '@lib/common/LinkOrDiv';
import {IconChevron} from '@lib/icons/IconChevron';
import {IconClone} from '@lib/icons/IconClone';
import IconSquarePlus from '@lib/icons/IconSquarePlus';
import {CurtainContent} from '@lib/primitives/Curtain';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';

export type TSideMenuItem = {
	href: string;
	label: string;
	icon: ReactElement;
	isDisabled?: boolean;
};
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
		<motion.li className={'relative z-10 px-4'}>
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
								icon.props.className,
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
		</motion.li>
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

export function SideMenuNav(props: {menu?: TSideMenuItem[]; onClose?: () => void}): ReactElement {
	const plausible = usePlausible();
	const pathname = usePathname();
	const [isSubMenuOpen, set_isSubMenuOpen] = useState(false);

	const safeMenu = [
		{
			href: '/new-safe',
			label: 'Create a Safe',
			icon: <IconSquarePlus />
		},
		{
			href: '/clone-safe',
			label: 'Clone a Safe',
			icon: <IconClone />
		}
	];

	return (
		<div className={'scrollable scrollbar-show h-full'}>
			<section className={'relative flex h-full flex-col justify-between overflow-hidden pt-4'}>
				<Dialog.Root
					modal={false}
					open={isSubMenuOpen}>
					<ul className={'grid gap-2 pb-8'}>
						{(props.menu || []).map(({href, label, icon, isDisabled}) => (
							<NavItem
								key={href}
								href={href}
								label={label}
								icon={icon}
								isDisabled={isDisabled}
								isSelected={pathname?.startsWith(href)}
								onClick={props.onClose}
							/>
						))}
					</ul>
					<div className={'mt-auto px-4'}>
						<Link
							onClick={() => plausible(PLAUSIBLE_EVENTS.NAVIGATE_TO_DUMP_SERVICES)}
							href={'https://dump.services/'}>
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
						<button onClick={() => set_isSubMenuOpen(true)}>
							{/* <Link
						onClick={() => plausible(PLAUSIBLE_EVENTS.NAVIGATE_TO_MULTISAFE)}
						href={'https://multisafe.app/'}> */}
							<div
								className={
									'bg-neutral-0 group relative flex w-full flex-col rounded-lg border border-neutral-400 p-2 opacity-60 transition-opacity hover:opacity-100'
								}>
								<p className={'pb-1 text-left text-xs font-semibold text-neutral-700'}>{'Multisafe'}</p>
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

								<span className={'text-left text-xs text-neutral-600'}>
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
							{/* </Link> */}
						</button>
						<div className={'text-xxs flex justify-between pb-2 pt-6 text-neutral-600'}>
							<div className={'flex gap-4'}>
								<Link
									onClick={() => plausible(PLAUSIBLE_EVENTS.NAVIGATE_TO_GITHUB)}
									className={'transition-colors hover:text-neutral-900'}
									href={'https://github.com/SmolDapp'}
									target={'_blank'}>
									{'GitHub'}
								</Link>
								<Link
									onClick={() => plausible(PLAUSIBLE_EVENTS.NAVIGATE_TO_TWITTER)}
									className={'transition-colors hover:text-neutral-900'}
									href={'https://twitter.com/smoldapp'}
									target={'_blank'}>
									{'Twitter'}
								</Link>
							</div>
							<LogOutButton />
						</div>
					</div>

					<CurtainContent onInteractOutside={e => e.preventDefault()}>
						<aside className={'bg-neutral-0 flex h-full flex-col'}>
							<div className={'scrollable text-neutral-600'}>
								<ul className={'grid gap-2 pb-8 pt-4'}>
									<div className={'px-4 pb-4 text-xs'}>
										<button
											onClick={() => set_isSubMenuOpen(false)}
											className={
												'flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900'
											}>
											<IconChevron className={'size-3 !rotate-180'} />
											{'Back'}
										</button>
									</div>
									{(safeMenu || []).map(({href, label, icon}) => (
										<NavItem
											key={href}
											href={href}
											label={label}
											icon={icon}
											isDisabled={false}
											isSelected={pathname?.startsWith(href)}
											onClick={props.onClose}
										/>
									))}
								</ul>
							</div>
						</aside>
					</CurtainContent>
				</Dialog.Root>
			</section>
		</div>
	);
}
