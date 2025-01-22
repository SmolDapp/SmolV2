'use client';

import {useAccount} from 'wagmi';

import {useBeraname} from '@smolHooks/web3/useBeraname';
import {useClusters} from '@smolHooks/web3/useClusters';
import {useENS} from '@smolHooks/web3/useENS';
import {AddressBookEntryAddress} from 'packages/smol/common/AddressBookEntry';
import {Avatar} from 'packages/smol/common/Avatar';

import {QRCodeElement} from './QRCode';

import type {ReactElement} from 'react';

export function ProfileBox(): ReactElement {
	const {name: ensName, avatar: ensAvatar, isLoading: isLoadingENS} = useENS();
	const {name: beraname, avatar: beranameAvatar, isLoading: isLoadingBeraname} = useBeraname();
	const {name: clustersName, avatar: clustersAvatar} = useClusters();
	const {isConnecting, address} = useAccount();
	const isLoadingAvatar = isLoadingENS || isLoadingBeraname;

	return (
		<div className={'flex gap-2'}>
			<Avatar
				sizeClassname={'h-10 w-10 min-w-[40px]'}
				isLoading={isLoadingAvatar || isConnecting}
				label={ensName || beraname || clustersName || undefined}
				address={address}
				src={ensAvatar || beranameAvatar || clustersAvatar}
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
