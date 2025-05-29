'use client';

import {useAccount} from 'wagmi';

import {AddressBookEntryAddress} from '@lib/components/AddressBookEntry';
import {Avatar} from '@lib/components/Avatar';
import {useClusters} from '@lib/hooks/web3/useClusters';
import {useENS} from '@lib/hooks/web3/useENS';

import {QRCodeElement} from './QRCode';

import type {ReactElement} from 'react';

export function ProfileBox(): ReactElement {
	const {name: ensName, avatar: ensAvatar, isLoading: isLoadingENS} = useENS();
	const {name: clustersName, avatar: clustersAvatar} = useClusters();
	const {isConnecting, address} = useAccount();
	const isLoadingAvatar = isLoadingENS;

	return (
		<div className={'flex gap-2'}>
			<Avatar
				sizeClassname={'h-10 w-10 min-w-[40px]'}
				isLoading={isLoadingAvatar || isConnecting}
				label={ensName || clustersName || undefined}
				address={address}
				src={ensAvatar || clustersAvatar}
			/>
			<AddressBookEntryAddress
				shouldTruncateAddress
				isConnecting={isConnecting}
				address={address}
				ens={ensName || clustersName}
			/>
			<QRCodeElement />
		</div>
	);
}
