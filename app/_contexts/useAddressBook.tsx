'use client';

import assert from 'assert';

import {useMountEffect} from '@react-hookz/web';
import {usePlausible} from 'next-plausible';
import React, {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';
import {useChainId} from 'wagmi';

import {AddressBookCurtain} from '@lib/components/Curtains/AddressBookCurtain';
import {AddressSelectorCurtain} from '@lib/components/Curtains/AddressSelectorCurtain';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {slugify} from '@lib/utils/helpers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {isAddress, toAddress, toSafeAddress} from '@lib/utils/tools.addresses';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {
	TAddressBookEntry,
	TAddressBookEntryReducer,
	TAddressBookProps,
	TCurtainStatus,
	TSelectCallback
} from 'app/(apps)/address-book/types';

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
	setCurtainStatus: (): void => undefined
};

const AddressBookContext = createContext<TAddressBookProps>(defaultProps);
export const WithAddressBook = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const plausible = usePlausible();
	const [shouldOpenCurtain, setShouldOpenCurtain] = useState(false);
	const [cachedEntries, setCachedEntries] = useState<TAddressBookEntry[]>([]);
	const [entryNonce, setEntryNonce] = useState<number>(0);
	const [curtainStatus, setCurtainStatus] = useState<TCurtainStatus>(defaultCurtainStatus);
	const [currentCallbackFunction, setCurrentCallbackFunction] = useState<TSelectCallback | undefined>(undefined);
	const {add, getAll, getOneByKey, update} = useIndexedDBStore<TAddressBookEntry>('address-book');
	const chainID = useChainId();

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
			setEntryNonce(nonce => nonce + 1);
		}
	});

	useAsyncTrigger(async (): Promise<void> => {
		entryNonce;
		const entriesFromDB = await getAll();
		setCachedEntries(entriesFromDB);
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
						mergedChains.push(chainID);
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
					setEntryNonce(nonce => nonce + 1);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(chainID);
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
					setEntryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_ADD_ENTRY);
				}
			} catch {
				// Do nothing
			}
		},
		[getEntry, update, plausible, chainID, add]
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
						mergedChains.push(chainID);
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
					setEntryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_UPDATE_ENTRY);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(chainID);
					}

					add({
						...entry,
						label,
						slugifiedLabel: slugify(label),
						isFavorite: entry.isFavorite || false,
						numberOfInteractions: entry.numberOfInteractions || 0,
						isHidden: false
					});
					setEntryNonce(nonce => nonce + 1);
					plausible(PLAUSIBLE_EVENTS.AB_ADD_ENTRY);
				}
			} catch {
				// Do nothing
			}
		},
		[add, getEntry, plausible, chainID, update]
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
					setEntryNonce(nonce => nonce + 1);
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
					setEntryNonce(nonce => nonce + 1);
				} else {
					assert(isAddress(entry.address));
					const chains = entry.chains || [];
					if (chains.length === 0) {
						chains.push(chainID);
					}
					add({
						...entry,
						chains,
						slugifiedLabel: slugify(entry.label),
						isHidden: true,
						numberOfInteractions: 1
					});
					setEntryNonce(nonce => nonce + 1);
				}
			} catch {
				// Do nothing
			}
		},
		[add, getEntry, update, chainID]
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
			setCurrentCallbackFunction(() => callbackFn);
			setShouldOpenCurtain(true);
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
			setCurtainStatus,
			onOpenCurtain,
			onCloseCurtain: (): void => setShouldOpenCurtain(false)
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
				onOpenChange={setShouldOpenCurtain}
				onSelect={currentCallbackFunction}
			/>
			<AddressBookCurtain
				selectedEntry={selectedEntry}
				dispatch={dispatch}
				isOpen={curtainStatus.isOpen}
				isEditing={curtainStatus.isEditing}
				initialLabel={curtainStatus.label}
				onOpenChange={status => {
					setCurtainStatus(status);
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
