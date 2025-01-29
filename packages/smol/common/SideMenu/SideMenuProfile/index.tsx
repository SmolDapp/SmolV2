'use client';

import {useIsMounted} from '@react-hookz/web';
import {useAccount} from 'wagmi';

import {NetworkPopoverSelector} from 'packages/smol/common/NetworkSelector/Popover';
import {CoinBalance} from 'packages/smol/common/SideMenu/SideMenuProfile/CoinBalance';
import {ConnectButton} from 'packages/smol/common/SideMenu/SideMenuProfile/ConnectButton';
import {ProfileBox} from 'packages/smol/common/SideMenu/SideMenuProfile/ProfileBox';
import {SkeletonPlaceholder} from 'packages/smol/common/SideMenu/SideMenuProfile/SkeletonPlaceholder';

import type {ReactElement} from 'react';

export function SideMenuProfile(): ReactElement {
	const isMounted = useIsMounted();
	const {address, isConnected, isConnecting} = useAccount();

	if (!isMounted() || isConnecting) {
		return <SkeletonPlaceholder />;
	}

	if ((!address || !isConnected) && !isConnecting) {
		return <ConnectButton />;
	}

	return (
		<section className={'p-4'}>
			<ProfileBox />

			<hr className={'mb-2 mt-4 text-neutral-200'} />

			<div className={'grid md:grid-cols-1 md:gap-2 lg:grid-cols-5 lg:gap-4'}>
				<div className={'col-span-3'}>
					<small>{'Chain'}</small>
					<NetworkPopoverSelector />
				</div>
				<div className={'col-span-2'}>
					<CoinBalance />
				</div>
			</div>
		</section>
	);
}
