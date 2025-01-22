import {isAddress, toAddress} from 'lib/utils/tools.addresses';
import {useCallback, useState} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';
import {isAddressEqual} from 'viem';
import {useAccount, useChainId} from 'wagmi';

import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';
import {useDeepCompareMemo} from '@smolHooks/useDeepCompare';

import type {TApproveEventChainSyncEntry} from 'packages/smol/app/(apps)/revoke/types';

function useApproveEventsChainSync(): {
	getEntries: () => Promise<TApproveEventChainSyncEntry[]>;
	currentEntry: TApproveEventChainSyncEntry | undefined;
	updateChainSyncEntry: (entry: TApproveEventChainSyncEntry) => Promise<void>;
} {
	const chainID = useChainId();
	const {address} = useAccount();
	const {add, getAll, update} = useIndexedDBStore<TApproveEventChainSyncEntry>('approve-events-chain-sync');
	const [currentEntry, setCurrentEntry] = useState<TApproveEventChainSyncEntry | undefined>();

	/**********************************************************************************************
	 ** A callback function that allows us to add entry into approve-events-chain-sync DB
	 *********************************************************************************************/
	const updateChainSyncEntry = useCallback(
		async (entry: TApproveEventChainSyncEntry): Promise<void> => {
			try {
				const chainSyncEntries = await getAll();
				const duplicateEntry = chainSyncEntries.find(
					item => isAddressEqual(item.address, entry.address) && item.chainID === entry.chainID
				);

				if (duplicateEntry) {
					await update({...duplicateEntry, blockNumber: entry.blockNumber});
					return;
				}
				await add(entry);
			} catch {
				// Do nothing
			}
		},
		[add, getAll, update]
	);

	/**********************************************************************************************
	 ** This useAsyncTrigger is used to retrieve a specific sync entry from the indexDB. The sync
	 ** entry is used to keep track of the last block number that was synced for a specific address
	 ** and chainID.
	 ** The first two conditions are used to make sure we are avoiding unnecessary calls to the DB,
	 ** which might result in re-renders.
	 ** If no entry is found in the DB, we set the currentEntry to the address and chainID that we
	 ** are currently working with, with a blockNumber of 0.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!isAddress(address)) {
			return;
		}
		if (isAddressEqual(toAddress(currentEntry?.address), address) && currentEntry?.chainID === chainID) {
			return;
		}
		const entriesFromDB = await getAll();
		const found = entriesFromDB.find(item => {
			return isAddressEqual(item.address, address) && item.chainID === chainID;
		});
		if (!found) {
			setCurrentEntry({address, chainID, blockNumber: 0n});
			return;
		}
		setCurrentEntry(found);
	}, [address, currentEntry?.address, currentEntry?.chainID, chainID, getAll]);

	return useDeepCompareMemo(() => {
		return {
			getEntries: getAll,
			currentEntry,
			updateChainSyncEntry
		};
	}, [getAll, currentEntry, updateChainSyncEntry]);
}

export {useApproveEventsChainSync};
