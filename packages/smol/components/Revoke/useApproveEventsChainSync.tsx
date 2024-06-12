import {useCallback, useState} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {isAddress, toAddress} from '@builtbymom/web3/utils';
import {useDeepCompareMemo} from '@react-hookz/web';
import {type TApproveEventChainSyncEntry} from '@lib/types/app.revoke';

function useApproveEventsChainSync(): {
	getEntries: () => Promise<TApproveEventChainSyncEntry[]>;
	currentEntry: TApproveEventChainSyncEntry | undefined;
	updateChainSyncEntry: (entry: TApproveEventChainSyncEntry) => Promise<void>;
} {
	const {address, chainID} = useWeb3();
	const {add, getAll, update} = useIndexedDBStore<TApproveEventChainSyncEntry>('approve-events-chain-sync');
	const [currentEntry, set_currentEntry] = useState<TApproveEventChainSyncEntry | undefined>();

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
			set_currentEntry({address, chainID, blockNumber: 0n});
			return;
		}
		set_currentEntry(found);
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
