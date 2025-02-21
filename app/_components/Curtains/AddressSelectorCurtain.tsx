'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {getEnsAddress} from '@wagmi/core';
import {LayoutGroup, motion} from 'framer-motion';
import {usePlausible} from 'next-plausible';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {isAddress} from 'viem';
import {mainnet} from 'viem/chains';
import {useConfig} from 'wagmi';

import {AddressBookEntry} from '@lib/components/AddressBookEntry';
import {Button} from '@lib/components/Button';
import {CurtainContent, CurtainTitle} from '@lib/components/Curtain';
import {CloseCurtainButton} from '@lib/components/Curtains/InfoCurtain';
import {TextInput} from '@lib/components/TextInput';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {toAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TAddressBookEntry, TSelectCallback} from 'app/(apps)/address-book/types';
import type {ReactElement, ReactNode} from 'react';
import type {GetEnsAddressReturnType} from 'viem';

function FavoriteList(props: {
	favorite: TAddressBookEntry[];
	searchValue: string;
	onSelect: TSelectCallback | undefined;
}): ReactNode {
	if (props.favorite.length === 0) {
		if (!props.searchValue) {
			return (
				<div
					className={
						'flex h-[72px] min-h-[72px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-400'
					}>
					<p className={'text-center text-xs text-neutral-600'}>{'No favorite yet.'}</p>
				</div>
			);
		}
		return null;
	}

	return (
		<>
			<motion.small
				layout
				className={'mt-0'}>
				{'Favorite'}
			</motion.small>
			{props.favorite.map(entry => (
				<motion.div
					layout
					initial={'initial'}
					key={`${entry.address}${entry.id}`}>
					<AddressBookEntry
						entry={entry}
						onSelect={selected => props.onSelect?.(selected)}
					/>
				</motion.div>
			))}
		</>
	);
}

function EntryList(props: {entries: TAddressBookEntry[]; onSelect: TSelectCallback | undefined}): ReactNode {
	if (props.entries.length === 0) {
		return null;
	}

	return (
		<>
			<motion.small
				layout
				className={'mt-4'}>
				{'Contacts'}
			</motion.small>
			{props.entries.map(entry => (
				<motion.div
					layout
					initial={'initial'}
					key={`${entry.address}${entry.id}`}>
					<AddressBookEntry
						entry={entry}
						onSelect={selected => props.onSelect?.(selected)}
					/>
				</motion.div>
			))}
		</>
	);
}

function ContactList(props: {
	favorite: TAddressBookEntry[];
	availableEntries: TAddressBookEntry[];
	searchValue: string;
	onSelect: TSelectCallback | undefined;
	onOpenChange: (isOpen: boolean) => void;
}): ReactElement {
	const config = useConfig();
	const {setCurtainStatus, dispatchConfiguration} = useAddressBook();

	/**********************************************************************************************
	 ** If user wants to add the TAddress we just put it in address input. If they use ens, we
	 ** go with relevant TAddress.
	 *********************************************************************************************/
	const getAddress = useCallback(
		(isSearchAnAddress: boolean, ensAddress: GetEnsAddressReturnType): TAddress | undefined => {
			if (isSearchAnAddress) {
				return toAddress(props.searchValue);
			}
			if (ensAddress) {
				return ensAddress;
			}
			return;
		},
		[props.searchValue]
	);

	/**********************************************************************************************
	 ** If searchValue is not an address and not a valid ENS, cut the ".eth" part and go with it.
	 *********************************************************************************************/
	const getLabel = useCallback(
		(
			isSearchAnAddress: boolean,
			isEnsCandidate: boolean,
			lowerCaseSearchValue: string,
			ensAddress: GetEnsAddressReturnType
		): string => {
			if (!getAddress(isSearchAnAddress, ensAddress) && !isEnsCandidate) {
				return props.searchValue;
			}
			if (isEnsCandidate) {
				return lowerCaseSearchValue.split('.').slice(0, -1).join(' ');
			}
			return '';
		},
		[getAddress, props.searchValue]
	);

	/**********************************************************************************************
	 ** When user's looking for sone entry in AB but doesn't find it, they has an option to add
	 ** this entry there. So if this searchValue is TAddress, we fill up address input in curtain.
	 ** If it is valid ENS, we fill address input with relevant ENS address, and first part of
	 ** ENS we place in name input. Last option is when search value is none of the above, we
	 ** just place it in name input.
	 *********************************************************************************************/
	const onAddToAB = useCallback(async () => {
		const isSearchAnAddress = isAddress(props.searchValue);
		const lowerCaseSearchValue = props.searchValue.toLowerCase();
		const isEnsCandidate = lowerCaseSearchValue.endsWith('.eth');

		let ensAddress: GetEnsAddressReturnType = null;
		if (isEnsCandidate) {
			ensAddress = await getEnsAddress(config, {
				name: lowerCaseSearchValue,
				chainId: mainnet.id
			});
		}

		dispatchConfiguration({
			type: 'SET_SELECTED_ENTRY',
			payload: {
				address: getAddress(isSearchAnAddress, ensAddress),
				label: getLabel(isSearchAnAddress, isEnsCandidate, lowerCaseSearchValue, ensAddress),
				slugifiedLabel: '',
				chains: [],
				isFavorite: false
			}
		});
		setCurtainStatus({isOpen: true, isEditing: true});
	}, [dispatchConfiguration, getAddress, getLabel, props.searchValue, setCurtainStatus, config]);

	return (
		<LayoutGroup>
			{props.searchValue !== '' && props.favorite.length === 0 && props.availableEntries.length === 0 && (
				<div
					className={
						'flex min-h-[72px] w-full flex-col items-center justify-center rounded-lg bg-primary px-10 pb-2 pt-4'
					}>
					<p className={'text-center text-xs text-neutral-900'}>
						{`We couldn't find any contact matching "${props.searchValue}".`}
					</p>

					<Button
						type={'button'}
						variant={'light'}
						className={'mt-2 !h-8 w-fit !text-xs'}
						onClick={onAddToAB}>
						{'Wanna add it?'}
					</Button>
				</div>
			)}
			<motion.div layout>
				<FavoriteList
					favorite={props.favorite}
					searchValue={props.searchValue}
					onSelect={selected => {
						props.onSelect?.(selected);
						props.onOpenChange(false);
					}}
				/>
				<EntryList
					entries={props.availableEntries}
					onSelect={selected => {
						props.onSelect?.(selected);
						props.onOpenChange(false);
					}}
				/>
			</motion.div>
		</LayoutGroup>
	);
}

export function AddressSelectorCurtain(props: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSelect: TSelectCallback | undefined;
}): ReactElement {
	const plausible = usePlausible();
	const {listCachedEntries} = useAddressBook();
	const [searchValue, setSearchValue] = useState('');

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			plausible(PLAUSIBLE_EVENTS.OPEN_ADDRESS_SELECTOR_CURTAIN);
			setSearchValue('');
		}
	}, [plausible, props.isOpen]);

	/**********************************************************************************************
	 ** Memo function that filters the entries in the address book based on the search value.
	 ** Only entries the label or the address of which includes the search value will be returned.
	 *********************************************************************************************/
	const filteredEntries = useMemo(() => {
		return listCachedEntries()
			.filter(entry => !entry.isHidden)
			.filter(
				entry =>
					entry.label.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
					toAddress(entry.address).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
			);
	}, [listCachedEntries, searchValue]);

	/**********************************************************************************************
	 ** Memo function that splits the entries in the address book into three arrays: favorite,
	 ** available and unavailable.
	 ** An entry is considered available if it is available on the current chain.
	 *********************************************************************************************/
	const [favorite, availableEntries] = useMemo(() => {
		const favorite = [];
		const available = [];
		for (const entry of filteredEntries) {
			if (entry.isFavorite) {
				favorite.push(entry);
			} else {
				available.push(entry);
			}
		}
		return [
			favorite.sort((a, b) => a.label.localeCompare(b.label)),
			available.sort((a, b) => a.label.localeCompare(b.label))
		];
	}, [filteredEntries]);

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'flex h-full flex-col overflow-y-hidden bg-neutral-0 p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<CurtainTitle className={'font-bold'}>{'Address Book'}</CurtainTitle>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<TextInput
							value={searchValue}
							onChange={setSearchValue}
						/>
						<div className={'scrollable mb-8 flex flex-col pb-2'}>
							<ContactList
								favorite={favorite}
								availableEntries={availableEntries}
								searchValue={searchValue}
								onSelect={props.onSelect}
								onOpenChange={props.onOpenChange}
							/>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
