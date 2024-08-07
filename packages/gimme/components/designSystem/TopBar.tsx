import {type ReactElement, useCallback, useMemo} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {type Router, useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {polygon} from 'wagmi/chains';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, truncateHex} from '@builtbymom/web3/utils';
import {PLAUSIBLE_EVENTS} from '@gimmeutils/plausible';
import {useAccountModal} from '@rainbow-me/rainbowkit';
import {LinkOrDiv} from '@lib/common/LinkOrDiv';
import {Button} from '@lib/primitives/Button';

import {NetworkPopoverSelector} from './NetworkPopoverSelector';

type TNavBar = {
	href: string;
	label: string;
	isDisabled?: boolean;
}[];

const TOP_NAV: TNavBar = [
	{
		href: '/earn',
		label: 'Earn'
	},
	{
		href: '/portfolio',
		label: 'Portfolio'
	},
	{
		href: '/about',
		label: 'About'
	}
];

const LANDING_TOP_NAV: TNavBar = [
	{
		href: '/',
		label: 'Home'
	},
	{
		href: '/info',
		label: 'About'
	},
	{
		href: 'https://docs.yearn.fi/',
		label: 'Docs'
	}
];

function WalletSection(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {address, ens, clusters, openLoginModal} = useWeb3();

	const plausible = usePlausible();

	const onConnect = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.CONNECT_WALLET);
		openLoginModal();
	}, [openLoginModal, plausible]);

	const buttonLabel = useMemo(() => {
		if (ens) {
			return ens;
		}
		if (clusters) {
			return clusters.name;
		}
		return truncateHex(address, 5);
	}, [address, clusters, ens]);

	if (!address) {
		return (
			<button
				onClick={onConnect}
				className={
					'bg-primary hover:bg-primaryHover h-14 rounded-2xl px-[13px] font-bold transition-colors md:w-full'
				}>
				{'Connect wallet'}
			</button>
		);
	}
	return (
		<div
			className={cl(
				'flex items-center justify-center gap-3 rounded-2xl border border-white bg-white/60 py-0 pl-2 backdrop-blur-md md:border-none md:bg-transparent md:p-0',
				'md:py-2 md:backdrop-filter-none'
			)}>
			<NetworkPopoverSelector networks={[polygon]} />
			<button
				onClick={(): void => {
					openAccountModal?.();
				}}
				className={'text-grey-900 pr-3 font-bold transition-all hover:opacity-70 md:mr-0'}>
				{buttonLabel}
			</button>
		</div>
	);
}

export function TopBar(props: {router: Router}): ReactElement {
	const {pathname} = useRouter();
	const isLandingPage = pathname === '/' || pathname === '/info';

	return (
		<>
			<div
				className={
					'bg-grey-500/30 border-grey-800/10 hidden grid-flow-row grid-cols-12 divide-x divide-white rounded-3xl border px-6 py-4 backdrop-blur-md md:grid'
				}>
				<Link
					className={'col-span-3 flex  py-2'}
					href={'/'}>
					<div className={'flex gap-2'}>
						<Image
							src={'/favicons/favicon.png'}
							alt={'gimme-logo'}
							width={40}
							height={40}
						/>
						<Image
							src={'/gimme-text.svg'}
							alt={'gimme'}
							width={107}
							height={34}
						/>
					</div>
				</Link>
				{/* <div className={'mx-10 w-px bg-white'} /> */}
				<div
					className={cl(
						'grid grid-cols-3 grid-flow-row place-content-stretch gap-2 items-center col-span-6 px-12'
					)}>
					{(isLandingPage ? LANDING_TOP_NAV : TOP_NAV).map(item => (
						<LinkOrDiv
							key={item.label}
							className={cl(
								'rounded-2xl text-center py-2 leading-6 transition-colors text-grey-800 font-bold',
								!item.isDisabled ? 'hover:text-neutral-800 hover:bg-white' : '',
								props.router.pathname === item.href ? '!text-neutral-900 bg-white' : ''
							)}
							href={item.href}
							target={item.href.startsWith('http') ? '_blank' : undefined}
							isDisabled={item.isDisabled}>
							{item.label}
						</LinkOrDiv>
					))}
				</div>
				{/* <div className={'mx-10 w-px bg-white'} /> */}
				<div className={'col-span-3 w-full place-content-center pl-6'}>
					{isLandingPage ? (
						<Link href={'/earn'}>
							<Button className={'w-full !rounded-2xl !px-4 !font-bold'}>{'Launch App'}</Button>
						</Link>
					) : (
						<WalletSection />
					)}
				</div>
			</div>
			<div className={'col-span-2 flex w-full justify-between md:hidden'}>
				<Link href={'/'}>
					<div className={'flex gap-1 py-2'}>
						<Image
							src={'/gimme-text.svg'}
							alt={'gimme'}
							width={107}
							height={34}
						/>
					</div>
				</Link>
				{isLandingPage ? (
					<Link href={'/earn'}>
						<Button className={'!rounded-2xl !font-bold'}>{'Launch App'}</Button>
					</Link>
				) : (
					<WalletSection />
				)}
				<div
					className={
						'bg-grey-500/30 border-grey-800/10 mb-22 fixed bottom-6 left-1/2 grid w-full max-w-[327px] -translate-x-1/2 grid-cols-3 gap-x-2 rounded-3xl border p-3 backdrop-blur-md md:hidden'
					}>
					{(isLandingPage ? LANDING_TOP_NAV : TOP_NAV).map(item => (
						<LinkOrDiv
							key={item.label}
							className={cl(
								'rounded-2xl text-center px-2 py-4 leading-5 transition-colors text-grey-800 font-bold',
								!item.isDisabled ? 'hover:text-neutral-900 hover:bg-white' : '',
								props.router.pathname === item.href ? '!text-neutral-900 bg-white' : ''
							)}
							href={item.href}
							isDisabled={item.isDisabled}>
							{item.label}
						</LinkOrDiv>
					))}
				</div>
			</div>
		</>
	);
}
