'use client';

import React, {Fragment, useEffect, useMemo, useState} from 'react';
import {Button} from 'lib/primitives/Button';
import {CurtainContent} from 'lib/primitives/Curtain';
import {TextInput} from 'lib/primitives/TextInput';
import {zeroAddress} from 'viem';
import {LayoutGroup, motion} from 'framer-motion';
import {isZeroAddress, toAddress} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';
import {useAddressBook} from '@smolContexts/useAddressBook';
import {CloseCurtainButton} from '@smolDesignSystem/Curtains/InfoCurtain';
import {useIsMounted} from '@smolHooks/useIsMounted';

import {AddressBookEntry} from '../AddressBookEntry';

import type {ReactElement, ReactNode} from 'react';
import type {TAddressBookEntry, TSelectCallback} from '@smolContexts/useAddressBook';

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
	const {set_curtainStatus, dispatchConfiguration} = useAddressBook();

	return (
		<LayoutGroup>
			{props.searchValue !== '' && props.favorite.length === 0 && props.availableEntries.length === 0 && (
				<div
					className={
						'bg-primary flex min-h-[72px] w-full flex-col items-center justify-center rounded-lg px-10 pb-2 pt-4'
					}>
					<p className={'text-center text-xs text-neutral-900'}>
						{`We couldn't find any contact matching "${props.searchValue}".`}
					</p>

					<Button
						type={'button'}
						variant={'light'}
						className={'mt-2 !h-8 w-fit !text-xs'}
						onClick={() => {
							const hasALabel = isZeroAddress(props.searchValue);
							const isSearchAnAddress = !isZeroAddress(props.searchValue);
							dispatchConfiguration({
								type: 'SET_SELECTED_ENTRY',
								payload: {
									address: isSearchAnAddress ? toAddress(props.searchValue) : zeroAddress,
									label: hasALabel ? props.searchValue : '',
									slugifiedLabel: '',
									chains: [],
									isFavorite: false
								}
							});
							set_curtainStatus({isOpen: true, isEditing: true});
						}}>
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
	const isMounted = useIsMounted();
	const {listCachedEntries} = useAddressBook();
	const [searchValue, set_searchValue] = useState('');

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			set_searchValue('');
		}
	}, [props.isOpen]);

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

	if (!isMounted) {
		return <Fragment />;
	}

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Address Book'}</h3>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<TextInput
							value={searchValue}
							onChange={set_searchValue}
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
