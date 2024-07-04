import {type ReactElement, useMemo} from 'react';
import Image from 'next/image';
import {polygon} from 'wagmi/chains';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal} from '@rainbow-me/rainbowkit';
import {LinkOrDiv} from '@lib/common/LinkOrDiv';

import {NetworkPopoverSelector} from './NetworkPopoverSelector';

import type {Router} from 'next/router';

const TOP_NAV = [
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
		label: 'About',
		isDisabled: true
	}
];

function WalletSection(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {address, ens, clusters, openLoginModal} = useWeb3();

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
				onClick={(): void => {
					openLoginModal();
				}}
				className={'bg-primary hover:bg-primaryHover h-14 rounded-2xl font-medium transition-colors'}>
				{'Connect wallet'}
			</button>
		);
	}
	return (
		<div className={'flex gap-4 py-2'}>
			<NetworkPopoverSelector networks={[polygon]} />
			<button
				onClick={(): void => {
					openAccountModal?.();
				}}
				className={'font-medium transition-all hover:opacity-70'}>
				{buttonLabel}
			</button>
		</div>
	);
}

export function TopBar(props: {router: Router}): ReactElement {
	return (
		<>
			<div
				className={
					'bg-grey-500/30 border-grey-800/10 hidden max-w-5xl rounded-3xl border p-4 backdrop-blur-md md:flex'
				}>
				<div className={'flex gap-1 py-2'}>
					<Image
						src={'/gimme-logo.png'}
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
				<div className={'mx-10 w-px bg-white'} />
				<div className={'flex items-center gap-2'}>
					{TOP_NAV.map(item => (
						<LinkOrDiv
							key={item.label}
							className={cl(
								'rounded-2xl text-center px-6 py-2 leading-6 transition-colors text-grey-800 font-medium',
								!item.isDisabled ? 'hover:text-neutral-800 hover:bg-neutral-300' : '',
								props.router.pathname === item.href ? '!text-neutral-900 bg-neutral-300' : ''
							)}
							href={item.href}
							isDisabled={item.isDisabled}>
							{item.label}
						</LinkOrDiv>
					))}
				</div>
				<div className={'mx-10 w-px bg-white'} />
				<WalletSection />
			</div>
			<div className={'flex justify-between md:hidden'}>
				<div className={'flex gap-1 py-2'}>
					<Image
						src={'/gimme-logo.png'}
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
				<div className={'rounded-3xl bg-white/60 px-2 backdrop-blur-md'}>
					<WalletSection />
				</div>
				<div
					className={
						'bg-grey-500/30 border-grey-800/10 mb-22 fixed bottom-6 left-1/2 z-10 grid w-full max-w-[327px] -translate-x-1/2 grid-cols-3 gap-x-2 rounded-3xl border p-3 shadow-md backdrop-blur-md md:hidden'
					}>
					{TOP_NAV.map(item => (
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
