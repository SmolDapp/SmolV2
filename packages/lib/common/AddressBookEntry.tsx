'use client';

import React, {useEffect, useMemo} from 'react';
import {toast} from 'react-hot-toast';
import {mainnet} from 'viem/chains';
import {useEnsAvatar, useEnsName} from 'wagmi';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, toAddress, toSafeAddress, truncateHex} from '@builtbymom/web3/utils';
import {useIsMounted} from '@smolHooks/useIsMounted';
import {TextTruncate} from '@lib/common/TextTruncate';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {IconCopy} from '@lib/icons/IconCopy';
import {IconHeart, IconHeartFilled} from '@lib/icons/IconHeart';
import {useClusters} from '@lib/utils/tools.clusters';

import {Avatar} from './Avatar';

import type {MouseEventHandler, ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TAddressBookEntry} from '@lib/types/AddressBook';

function EntryBookEntryFavorite(props: {
	isFavorite: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
}): ReactElement {
	return (
		<button
			role={'switch'}
			onClick={props.onClick}
			className={'withRing -mr-1 -mt-1 rounded p-1'}>
			<div className={'group relative flex size-4 items-center justify-center'}>
				<IconHeart
					className={cl(
						'absolute h-4 w-4 transition-colors',
						props.isFavorite
							? 'text-transparent group-hover:text-neutral-400 hover:!text-neutral-600'
							: 'text-transparent group-hover:text-neutral-600'
					)}
				/>
				<IconHeartFilled
					className={cl(
						'absolute h-4 w-4 transition-colors',
						props.isFavorite ? 'text-neutral-600' : 'text-transparent hover:!text-neutral-400'
					)}
				/>
			</div>
		</button>
	);
}

export function AddressBookEntryAddress(props: {
	address: TAddress | undefined;
	ens: string | undefined;
	isConnecting?: boolean;
	shouldTruncateAddress?: boolean;
	isAddressBookEntry?: boolean;
}): ReactElement {
	const isMounted = useIsMounted();

	if (!isMounted || props.isConnecting) {
		return (
			<div className={'grid w-full max-w-[288px] gap-2'}>
				<div className={'skeleton-lg h-4 w-full'} />
				<div className={'skeleton-lg h-4 w-2/3'} />
			</div>
		);
	}

	/**********************************************************************************************
	 ** AddressBookEntry that will be used in AddressBook, but not in the rest app.
	 *********************************************************************************************/
	const AddressBookEntry: ReactElement = (
		<div className={'grid w-full'}>
			<b className={'text-left text-base'}>
				{toSafeAddress({address: props.address, ens: props.ens, addrOverride: props.address?.substring(0, 6)})}
			</b>
			<div className={'flex'}>
				<TextTruncate
					value={props.shouldTruncateAddress ? toSafeAddress({address: props.address}) : props.address}
					className={'text-xxs !max-w-[264px] cursor-pointer tabular-nums'}
				/>
				<button
					onClick={e => {
						e.stopPropagation();
						navigator.clipboard.writeText(toAddress(props.address));
						toast.success(`Address copied to clipboard: ${toAddress(props.address)}`);
					}}
					className={'z-20 cursor-copy'}>
					<IconCopy className={'mb-1 size-3'} />
				</button>
			</div>
		</div>
	);

	return (
		<>
			{props.isAddressBookEntry ? (
				AddressBookEntry
			) : (
				<div className={'grid w-full'}>
					<b className={'text-left text-base'}>
						{toSafeAddress({
							address: props.address,
							ens: props.ens,
							addrOverride: props.address?.substring(0, 6)
						})}
					</b>
					<button
						className={'z-10 w-full'}
						onClick={e => {
							e.stopPropagation();
							navigator.clipboard.writeText(toAddress(props.address));
							toast.success(`Address copied to clipboard: ${toAddress(props.address)}`);
						}}>
						<TextTruncate
							value={
								props.shouldTruncateAddress ? toSafeAddress({address: props.address}) : props.address
							}
							className={'text-xxs cursor-copy hover:underline'}
						/>
					</button>
				</div>
			)}
		</>
	);
}

export function AddressBookEntry(props: {
	entry: TAddressBookEntry;
	onSelect: (entry: TAddressBookEntry) => void;
	isChainRestricted?: boolean;
}): ReactElement {
	const {chainID} = useChainID();
	const {updateEntry} = useAddressBook();
	const {data: ensName} = useEnsName({chainId: mainnet.id, address: toAddress(props.entry.address)});
	const {data: avatar, isLoading: isLoadingAvatar} = useEnsAvatar({
		chainId: mainnet.id,
		name: ensName || props.entry.ens,
		query: {
			enabled: Boolean(ensName || props.entry.ens)
		}
	});
	const clusters = useClusters(toAddress(props.entry.address));

	useEffect((): void => {
		if ((ensName && !props.entry.ens) || (ensName && props.entry.ens !== ensName)) {
			updateEntry({...props.entry, ens: ensName});
		} else if (clusters?.name && !props.entry.ens) {
			updateEntry({...props.entry, ens: clusters.name});
		}
	}, [clusters, ensName, props.entry, updateEntry]);

	return (
		<div
			role={'button'}
			onClick={() => {
				props.onSelect({...props.entry, ens: ensName || clusters?.name || undefined});
			}}
			className={cl(
				'mb-2 flex flex-row items-center justify-between rounded-lg p-4 w-full group',
				'bg-neutral-200 hover:bg-neutral-300 transition-colors',
				props.isChainRestricted && !props.entry.chains.includes(chainID)
					? 'opacity-40 hover:opacity-100 transition-opacity'
					: ''
			)}>
			<div className={'relative flex w-full items-center gap-2'}>
				<Avatar
					isLoading={isLoadingAvatar}
					address={toAddress(props.entry.address)}
					label={props.entry.label}
					src={avatar}
				/>
				<AddressBookEntryAddress
					isAddressBookEntry={true}
					address={toAddress(props.entry.address)}
					ens={
						ensName || clusters?.name
							? `${props.entry.label} (${ensName || clusters?.name})`
							: props.entry.label
					}
				/>
				<div className={'absolute inset-y-0 right-0 flex items-center'}>
					<EntryBookEntryFavorite
						isFavorite={Boolean(props.entry.isFavorite)}
						onClick={event => {
							event.stopPropagation();
							updateEntry({...props.entry, isFavorite: !props.entry.isFavorite});
						}}
					/>
				</div>
			</div>
		</div>
	);
}

/**************************************************************************************************
 ** The AddressEntry component is a wrapper around the AddressBookEntryAddress component only based
 ** on the provided address. It's used to abstract the logic of fetching the ENS name and avatar
 ** from the component that uses it.
 *************************************************************************************************/
export function AddressEntry(props: {address: TAddress}): ReactElement {
	const {getCachedEntry} = useAddressBook();
	const {data: ensName} = useEnsName({chainId: mainnet.id, address: toAddress(props.address)});
	const {data: avatar, isLoading: isLoadingAvatar} = useEnsAvatar({
		chainId: mainnet.id,
		name: ensName || '',
		query: {
			enabled: Boolean(ensName)
		}
	});
	const clusters = useClusters(toAddress(props.address));

	const cached = useMemo(
		() => getCachedEntry({address: props.address, label: ensName || truncateHex(props.address, 5)}),
		[ensName, getCachedEntry, props.address]
	);

	return (
		<div
			role={'button'}
			className={cl(
				'mb-2 flex flex-row items-center justify-between rounded-lg p-4 w-full group',
				'bg-neutral-200'
			)}>
			<div className={'relative flex w-full items-center gap-2'}>
				<Avatar
					isLoading={isLoadingAvatar}
					address={toAddress(props.address)}
					label={ensName ? ensName : cached?.label || truncateHex(props.address, 5)}
					src={avatar}
				/>
				<AddressBookEntryAddress
					address={toAddress(props.address)}
					ens={
						ensName || clusters?.name
							? ensName || clusters?.name
							: cached?.label || truncateHex(props.address, 5)
					}
				/>
			</div>
		</div>
	);
}
