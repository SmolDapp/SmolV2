'use client';

import React, {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {usePlausible} from 'next-plausible';
import assert from 'assert';
import {useIndexedDBStore} from 'use-indexeddb';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {isAddress, toAddress, toSafeAddress} from '@builtbymom/web3/utils';
import {useMountEffect} from '@react-hookz/web';
import {AddressBookCurtain} from '@lib/common/Curtains/AddressBookCurtain';
import {AddressSelectorCurtain} from '@lib/common/Curtains/AddressSelectorCurtain';
import {slugify} from '@lib/utils/helpers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {
	TAddressBookEntry,
	TAddressBookEntryReducer,
	TAddressBookProps,
	TCurtainStatus,
	TSelectCallback
} from 'packages/lib/types/AddressBook';
import type {TAddress} from '@builtbymom/web3/types';

const defaultCurtainStatus = {
	isOpen: false,
	isEditing: false
};
const defaultProps: TAddressBookProps = {
	shouldOpenCurtain: false,
	selectedEntry: undefined,
	curtainStatus: defaultCurtainStatus,
	listEntries: async (): Promise<TAddressBookEntry[]> => [],
	listCachedEntries: (): TAddressBookEntry[] => [],
	getEntry: async (): Promise<TAddressBookEntry | undefined> => undefined,
	getCachedEntry: (): TAddressBookEntry | undefined => undefined,
	addEntry: async (): Promise<void> => undefined,
	updateEntry: async (): Promise<void> => undefined,
	bumpEntryInteractions: async (): Promise<void> => undefined,
	deleteEntry: async (): Promise<void> => undefined,
	onOpenCurtain: (): void => undefined,
	onCloseCurtain: (): void => undefined,
	dispatchConfiguration: (): void => undefined,
	set_curtainStatus: (): void => undefined
};

const AddressBookContext = createContext<TAddressBookProps>(defaultProps);
export const WithAddressBook = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const plausible = usePlausible();
	const [shouldOpenCurtain, set_shouldOpenCurtain] = useState(false);
	const [cachedEntries, set_cachedEntries] = useState<TAddressBookEntry[]>([]);
	const [entryNonce, set_entryNonce] = useState<number>(0);
	const [curtainStatus, set_curtainStatus] = useState<TCurtainStatus>(defaultCurtainStatus);
	const [currentCallbackFunction, set_currentCallbackFunction] = useState<TSelectCallback | undefined>(undefined);
	const {add, getAll, getOneByKey, update} = useIndexedDBStore<TAddressBookEntry>('address-book');
	const {safeChainID} = useChainID();

	useMountEffect(async () => {
		/* Initially add smol address in the AB */
		const entriesFromDB = await getAll();
		if (entriesFromDB.length === 0) {
			add({
				address: toAddress(process.env.SMOL_ADDRESS),
				label: 'smol',
				isFavorite: false,
				chains: supportedNetworks.map(chain => chain.id),
				isHidden: false,
				numberOfInteractions: 0,
				slugifiedLabel: 'smol'
			});
			set_entryNonce(nonce => nonce + 1);
		}
	});

	useAsyncTrigger(async (): Promise<void> => {
		entryNonce;
		const entriesFromDB = await getAll();
		set_cachedEntries(entriesFromDB);
	}, [getAll, entryNonce]);

	/**************************************************************************
	 * Callback function that can be used to retrieve an entry from the
	 * address book.
	 * It can be used to retrieve an entry by its address or by its label.
	 *************************************************************************/
	const listEntries = useCallback(async (): Promise<TAddressBookEntry[]> => {
		entryNonce;
		return await getAll();
	}, [getAll, entryNonce]);

	const listCachedEntries = useCallback((): TAddressBookEntry[] => {
		entryNonce;
		return cachedEntries;
	}, [cachedEntries, entryNonce]);

	/**************************************************************************
	 * Callback function that can be used to retrieve an entry from the
	 * address book.
	 * It can be used to retrieve an entry by its address or by its label.
	 *************************************************************************/
	const getEntry = useCallback(
		async (props: {address?: TAddress; label?: string}): Promise<TAddressBookEntry | undefined> => {
			entryNonce;
			if (!isAddress(props.address) && !props.label) {
				return undefined;
			}

			try {
				const foundByAddress = await getOneByKey('address', toAddress(props.address));
				if (foundByAddress) {
					return foundByAddress;
				}
				if (props.label) {
					const foundByLabel = await getOneByKey('slugifiedLabel', slugify(props.label || ''));
					return foundByLabel || undefined;
				}
				return undefined;
			} catch (error) {
				return undefined;
			}
		},
		[getOneByKey, entryNonce]
	);
	const getCachedEntry = useCallback(
		(props: {address?: TAddress; label?: string}): TAddressBookEntry | undefined => {
			entryNonce;
			if (!isAddress(props.address) && !props.label) {
				return undefined;
			}

			const foundByAddress = cachedEntries.find(entry => entry.address === props.address);
			if (foundByAddress) {
				return foundByAddress;
			}
			const foundByLabel = cachedEntries.find(entry => entry.slugifiedLabel === slugify(props.label || ''));
			return foundByLabel || undefined;
		},
		[cachedEntries, entryNonce]
	);

	/**************************************************************************
	 * Callback function that can be used to update an entry in the address
	 * book. If the entry does not exist, it will be created.
	 *************************************************************************/
	const updateEntry = useCallback(
		async (entry: TAddressBookEntry): Promise<void> => {
			try {
				const existingEntry = await getEntry({address: entry.address});
				const label =
					entry.label ||
					toSafeAddress({address: entry.address, addrOverride: entry.address?.substring(2, 8)});
				if (existingEntry) {
					const mergedChains = [...(entry.chains || [])];
					if (mergedChains.length === 0) {
						mergedChains.push(safeChainID);
					}
					const mergedTags = [...(existingEntry.tags || []), ...(entry.tags || [])];

					const mergedFields = {
						...existingEntry,
						...entry,
						label,

						chains: mergedChains,
						tags: mergedTags
					};
					mergedFields.chains = [...new Set(mergedFields.chains)].filter(chain => chain !== 0);
					update({...mergedFields, slugifiedLabel: slugify(mergedFields.label)});
					plausible(PLAUSIBLE_EVENTS.AB_UPDATE_ENTRY);
					set_entryNonce(nonce => nonce + 1);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(safeChainID);
					}
					add({
						...entry,
						label,
						chains,
						slugifiedLabel: slugify(label),
						isFavorite: entry.isFavorite || false,
						numberOfInteractions: entry.numberOfInteractions || 0,
						isHidden: false
					});
					set_entryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_ADD_ENTRY);
				}
			} catch {
				// Do nothing
			}
		},
		[getEntry, update, plausible, safeChainID, add]
	);

	/**************************************************************************
	 * Callback function that can be used to add an entry in the address
	 * book. This is very similar to updateEntry, but will give update priority
	 * to the smol database instead of the new entry.
	 *************************************************************************/
	const addEntry = useCallback(
		async (entry: TAddressBookEntry): Promise<void> => {
			try {
				const existingEntry = await getEntry({address: entry.address});
				const label =
					entry.label ||
					toSafeAddress({
						address: entry.address,
						addrOverride: entry.address?.substring(2, 8)
					});
				if (existingEntry) {
					const mergedChains = [...(entry.chains || []), ...(existingEntry.chains || [])];
					if (mergedChains.length === 0) {
						mergedChains.push(safeChainID);
					}
					const mergedTags = [...(entry.tags || []), ...(existingEntry.tags || [])];

					const mergedFields = {
						...entry,
						...existingEntry,
						label,
						chains: mergedChains,
						tags: mergedTags,
						isHidden: false
					};
					mergedFields.chains = [...new Set(mergedFields.chains)].filter(chain => chain !== 0);
					update({...mergedFields, slugifiedLabel: slugify(mergedFields.label)});
					set_entryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_UPDATE_ENTRY);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(safeChainID);
					}

					add({
						...entry,
						label,
						slugifiedLabel: slugify(label),
						isFavorite: entry.isFavorite || false,
						numberOfInteractions: entry.numberOfInteractions || 0,
						isHidden: false
					});
					set_entryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_ADD_ENTRY);
				}
			} catch {
				// Do nothing
			}
		},
		[add, getEntry, plausible, safeChainID, update]
	);

	/**************************************************************************
	 * Callback function that can be used to delete an entry from the address
	 * book.
	 *************************************************************************/
	const deleteEntry = useCallback(
		async (address: TAddress): Promise<void> => {
			try {
				const existingEntry = await getEntry({address: address});
				if (existingEntry) {
					plausible(PLAUSIBLE_EVENTS.AB_DELETE_ENTRY);
					update({...existingEntry, isHidden: true});
					set_entryNonce(nonce => nonce + 1);
				}
			} catch {
				// Do nothing
			}
		},
		[getEntry, plausible, update]
	);

	/**************************************************************************
	 * Callback function that can be used to increment an entry
	 * `numberOfInteractions` field. This is used to keep track of how many
	 * times an address has been used for a transaction.
	 *************************************************************************/
	const bumpEntryInteractions = useCallback(
		async (entry: TAddressBookEntry): Promise<void> => {
			try {
				const existingEntry = await getEntry({address: entry.address});
				if (existingEntry) {
					existingEntry.numberOfInteractions = (existingEntry.numberOfInteractions || 0) + 1;
					update(existingEntry);
					set_entryNonce(nonce => nonce + 1);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(safeChainID);
					}
					add({
						...entry,
						chains,
						slugifiedLabel: slugify(entry.label),
						isHidden: true,
						numberOfInteractions: 1
					});
					set_entryNonce(nonce => nonce + 1);
				}
			} catch {
				// Do nothing
			}
		},
		[add, getEntry, update, safeChainID]
	);

	const entryReducer = (state: TAddressBookEntry, action: TAddressBookEntryReducer): TAddressBookEntry => {
		switch (action.type) {
			case 'SET_SELECTED_ENTRY':
				return action.payload;
			case 'SET_ADDRESS':
				return {...state, address: toAddress(action.payload)};
			case 'SET_LABEL':
				return {...state, label: action.payload};
			case 'SET_CHAINS':
				return {...state, chains: action.payload};
			case 'SET_IS_FAVORITE':
				updateEntry({...state, isFavorite: action.payload});
				return {...state, isFavorite: action.payload};
		}
	};

	const [selectedEntry, dispatch] = useReducer(entryReducer, {
		address: undefined,
		label: '',
		slugifiedLabel: '',
		chains: [],
		isFavorite: false
	});

	/**********************************************************************************************
	 ** OnOpenCurtain is a callback function that can be used to open the AddressSelectorCurtain.
	 ** It will also set the onSelect callback function that will be called when an address is
	 ** selected.
	 **********************************************************************************************/
	const onOpenCurtain = useCallback(
		(callbackFn: TSelectCallback): void => {
			plausible(PLAUSIBLE_EVENTS.OPEN_AB_CURTAIN);
			set_currentCallbackFunction(() => callbackFn);
			set_shouldOpenCurtain(true);
		},
		[plausible]
	);

	/**************************************************************************
	 * Context value that is passed to all children of this component.
	 *************************************************************************/
	const contextValue = useMemo(
		(): TAddressBookProps => ({
			shouldOpenCurtain,
			listEntries,
			listCachedEntries,
			getEntry,
			getCachedEntry,
			addEntry,
			updateEntry,
			deleteEntry,
			bumpEntryInteractions,
			selectedEntry,
			dispatchConfiguration: dispatch,
			curtainStatus,
			set_curtainStatus,
			onOpenCurtain,
			onCloseCurtain: (): void => set_shouldOpenCurtain(false)
		}),
		[
			shouldOpenCurtain,
			listEntries,
			listCachedEntries,
			getEntry,
			getCachedEntry,
			addEntry,
			updateEntry,
			deleteEntry,
			bumpEntryInteractions,
			selectedEntry,
			curtainStatus,
			onOpenCurtain
		]
	);

	return (
		<AddressBookContext.Provider value={contextValue}>
			{children}
			<AddressSelectorCurtain
				isOpen={shouldOpenCurtain}
				onOpenChange={set_shouldOpenCurtain}
				onSelect={currentCallbackFunction}
			/>
			<AddressBookCurtain
				selectedEntry={selectedEntry}
				dispatch={dispatch}
				isOpen={curtainStatus.isOpen}
				isEditing={curtainStatus.isEditing}
				initialLabel={curtainStatus.label}
				onOpenChange={status => {
					set_curtainStatus(status);
					if (!status.isOpen) {
						dispatch({
							type: 'SET_SELECTED_ENTRY',
							payload: {
								address: undefined,
								label: '',
								slugifiedLabel: '',
								chains: [],
								isFavorite: false
							}
						});
					}
				}}
			/>
		</AddressBookContext.Provider>
	);
};

export const useAddressBook = (): TAddressBookProps => {
	const ctx = useContext(AddressBookContext);
	if (!ctx) {
		throw new Error('AddressBookContext not found');
	}
	return ctx;
};
