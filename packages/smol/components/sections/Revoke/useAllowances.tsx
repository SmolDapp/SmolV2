import {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState} from 'react';
import {
	type TAllowances,
	type TApproveEventChainSyncEntry,
	type TApproveEventEntry,
	type TExpandedAllowance,
	type TRevokeActions,
	type TRevokeConfiguration,
	type TRevokeContext
} from 'packages/lib/types/Revoke';
import {isDev} from 'packages/lib/utils/constants';
import {optionalRenderProps, type TOptionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents, isUnlimited} from 'packages/lib/utils/tools.revoke';
import {useIndexedDBStore} from 'use-indexeddb';
import {erc20Abi as abi} from 'viem';
import {useReadContracts} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {isZeroAddress, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {parsedApprovalEvent, useInfiniteApprovalLogs} from '@smolHooks/useInfiniteContractLogs';
import {readContracts} from '@wagmi/core';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types/address';

const initialFilters = {
	unlimited: {
		filter: null
	},
	withBalance: {
		filter: null
	},
	asset: {
		filter: []
	},
	spender: {
		filter: []
	}
};

const defaultProps: TRevokeContext = {
	allowances: null,
	filteredAllowances: null,
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: [],
		tokenToRevoke: undefined,
		allowancesFilters: initialFilters
	},
	dispatchConfiguration: (): void => undefined,
	isDoneWithInitialFetch: false,
	isLoading: false,
	fetchTokenToSearch: () => undefined
};

const configurationReducer = (state: TRevokeConfiguration, action: TRevokeActions): TRevokeConfiguration => {
	switch (action.type) {
		case 'SET_TOKEN_TO_CHECK':
			return {...state, tokenToCheck: action.payload};
		case 'SET_FILTER':
			return {...state, allowancesFilters: action.payload};
		case 'SET_TOKENS_TO_CHECK':
			return {...state, tokensToCheck: action.payload ? [...action.payload] : []};
		case 'SET_TOKEN_TO_REVOKE':
			return {...state, tokenToRevoke: action.payload};
	}
};

const RevokeContext = createContext<TRevokeContext>(defaultProps);
export const RevokeContextApp = (props: {
	children: TOptionalRenderProps<TRevokeContext, ReactElement>;
}): ReactElement => {
	const {address} = useWeb3();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const [approveEvents, set_approveEvents] = useState<TAllowances | null>(null);
	const [allowances, set_allowances] = useState<TAllowances | null>(null);
	const [expandedAllowances, set_expandedAllowances] = useState<TExpandedAllowance[]>([]);
	const {chainID, safeChainID} = useChainID();
	const {currentNetworkTokenList} = useTokenList();
	const [entryNonce, set_entryNonce] = useState<number>(0);
	const [chainSyncNonce, set_chainSyncNonce] = useState<number>(0);
	const [cachedApproveEvents, set_cachedApproveEvents] = useState<TApproveEventEntry[]>([]);
	const [cachedChainSync, set_cachedChainSync] = useState<TApproveEventChainSyncEntry[]>([]);

	const {getAll, add, deleteByID} = useIndexedDBStore<TApproveEventEntry>('approve-events');
	const {
		add: addChainSync,
		getAll: getAllChainSync,
		update: updateChainSync
	} = useIndexedDBStore<TApproveEventChainSyncEntry>('approve-events-chain-sync');

	/**********************************************************************************************
	 ** Every time user changes chain or wallet address, we add to DB chain-sync entry.
	 ** 'currentChainSyncEntry' is entry with current chainID and adderss of user
	 *********************************************************************************************/
	const currentChainSyncEntry = useMemo(() => {
		if (!cachedChainSync) {
			return;
		}

		const currentItem = cachedChainSync.find(item => item.address === address && item.chainID === safeChainID);

		return currentItem;
	}, [address, cachedChainSync, safeChainID]);

	/**********************************************************************************************
	 ** A callback function that allows us to add entry into approve-events DB
	 *********************************************************************************************/
	const addApproveEventEntry = useCallback(
		async (entry: TApproveEventEntry): Promise<void> => {
			try {
				if (currentChainSyncEntry) {
					const duplicateAllowace = cachedApproveEvents.find(
						item => item.address === entry.address && item.sender === entry.sender
					);

					duplicateAllowace?.id && deleteByID(duplicateAllowace?.id);
					add(entry);
					set_entryNonce(nonce => nonce + 1);
				}
			} catch {
				// Do nothing
			}
		},
		[add, cachedApproveEvents, currentChainSyncEntry, deleteByID]
	);

	/**********************************************************************************************
	 ** A callback function that allows us to add entry into approve-events-chain-sync DB
	 *********************************************************************************************/
	const addChainSyncEntry = useCallback(
		async (entry: TApproveEventChainSyncEntry): Promise<void> => {
			address;
			try {
				addChainSync({...entry, id: Date.now()});
				set_chainSyncNonce(nonce => nonce + 1);
			} catch {
				// Do nothing
			}
		},
		[addChainSync, address]
	);

	/**********************************************************************************************
	 ** A callback function that allows us to update approve-events-chain-sync entry
	 *********************************************************************************************/
	const updateChainSyncEntry = useCallback(
		async (entry: TApproveEventChainSyncEntry) => {
			try {
				if (!currentChainSyncEntry?.id) {
					return;
				}

				updateChainSync({...currentChainSyncEntry, blockNumber: entry.blockNumber});
				set_chainSyncNonce(nonce => nonce + 1);
			} catch {
				// Do nothing
			}
		},
		[currentChainSyncEntry, updateChainSync]
	);

	/**********************************************************************************************
	 ** Every time we interact with approve events in DB, we want to immedeatley have up to date
	 ** data from DB
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		entryNonce;
		const entriesFromDB = await getAll();
		set_cachedApproveEvents(entriesFromDB);
	}, [entryNonce, getAll]);

	/**********************************************************************************************
	 ** Every time we interact with chain-sync events in DB, we want to immedeatley have up to date
	 ** data from DB
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		chainSyncNonce;
		const entryFromDB = await getAllChainSync();
		set_cachedChainSync(entryFromDB);
	}, [chainSyncNonce, getAllChainSync]);

	/**********************************************************************************************
	 ** We're retrieving an array of addresses from the currentNetworkTokenList, intending to
	 ** obtain allowances for each address in the list. This process allows us to gather allowance
	 ** data for all tokens listed.
	 *********************************************************************************************/
	const tokenAddresses = useMemo(() => {
		const arr = Object.values(currentNetworkTokenList)
			.map(item => item.address)
			.slice(0, 2);
		// arr.push('0x6b175474e89094c44da98b954eedeac495271d0f');
		// arr.push('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
		arr.push('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063');
		arr.push('0xda10009cbd5d07dd0cecc66161fc93d7c9000da1');
		return arr;
	}, [currentNetworkTokenList]);

	/**********************************************************************************************
	 ** The allowances vary across different chains, necessitating us to reset the current state
	 ** when the user switches chains or change the address.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (
			!cachedChainSync ||
			cachedChainSync.some(item => item.address === address && item.chainID === safeChainID) ||
			!address
		) {
			return;
		}

		addChainSyncEntry({address, chainID: isDev ? chainID : safeChainID, blockNumber: 8_928_158n});
		set_entryNonce(nonce => nonce + 1);
		set_chainSyncNonce(nonce => nonce + 1);
	}, [cachedChainSync, address, addChainSyncEntry, chainID, safeChainID]);

	/**********************************************************************************************
	 ** In DB we store approve-events for all addresses and ChainIDs. But we need to show to user
	 ** only those that match their address and chainID
	 *********************************************************************************************/
	const chainFilteredAllowances = useMemo(() => {
		const _formatedAllowances: TExpandedAllowance[] = [];
		for (const allowance of cachedApproveEvents) {
			_formatedAllowances.push({
				...allowance,
				args: {
					owner: allowance.owner,
					sender: allowance.sender,
					value: allowance.value
				}
			});
		}

		const filteredAllowances = _formatedAllowances.filter(
			item => item.args.owner === address && item?.chainID === safeChainID
		);

		return filteredAllowances;
	}, [address, cachedApproveEvents, safeChainID]);

	/**********************************************************************************************
	 ** We sequentially apply filters to the allowances based on the provided filter object. First,
	 ** we check for the presence of the 'unlimited' filter and apply it. Then, we move on to the
	 ** 'asset' filter, ensuring the array is not empty before filtering by assets. The same
	 ** process applies to the 'spender' filter.
	 *********************************************************************************************/
	const filteredAllowances = useDeepCompareMemo(() => {
		const filters = configuration.allowancesFilters;
		return chainFilteredAllowances?.filter(item => {
			if (filters.unlimited.filter === 'unlimited') {
				if (!isUnlimited(item.args.value as bigint)) {
					return false;
				}
			} else if (filters.unlimited.filter === 'limited') {
				if (isUnlimited(item.args.value as bigint)) {
					return false;
				}
			}

			if (filters.withBalance.filter === 'with-balance') {
				if (item.balanceOf && item.balanceOf === 0) {
					return false;
				}
			} else if (filters.withBalance.filter === 'without-balance') {
				if (item.balanceOf && item.balanceOf > 0) {
					return false;
				}
			}

			if (filters.asset.filter.length > 0) {
				if (!filters.asset.filter.includes(item.address)) {
					return false;
				}
			}

			if (filters.spender.filter.length > 0) {
				if (!filters.spender.filter.includes(item.args.sender)) {
					return false;
				}
			}

			return true;
		});
	}, [configuration.allowancesFilters, chainFilteredAllowances]);

	/**********************************************************************************************
	 ** Once we've gathered approval events for the token list, we need to verify if allowances
	 ** still persist on the chain and haven't been utilized by the contract. To achieve this, we
	 ** utilize the allowance function on the ERC20 contract.
	 *********************************************************************************************/
	const {data: allAllowances, isLoading} = useReadContracts({
		contracts: approveEvents?.map(item => {
			return {
				address: item.address,
				abi,
				functionName: 'allowance',
				chainID: chainID,
				args: [item.args.owner, item.args.sender]
			};
		})
	});

	/**********************************************************************************************
	 ** We utilize a watcher to consistently obtain the latest approval events for the list of
	 ** tokens.
	 *********************************************************************************************/
	const {data, isDoneWithInitialFetch} = useInfiniteApprovalLogs({
		chainID: isDev ? chainID : safeChainID,
		addresses: tokenAddresses,
		startBlock: currentChainSyncEntry?.blockNumber || 8_928_158n,
		owner: toAddress(address),
		pageSize: 1_000_000n
	});

	const fetchTokenToSearch = useCallback(async () => {
		const res = await getClient(chainID).getLogs({
			address: [toAddress(configuration.tokenToCheck)],
			event: parsedApprovalEvent,
			args: {
				owner: address
			},
			fromBlock: 8_928_158n
		});
		set_approveEvents(res as TAllowances);
	}, [address, chainID, configuration.tokenToCheck]);

	/**********************************************************************************************
	 ** Once we've gathered all the latest allowances from the blockchain, we aim to utilize only
	 ** those with a value. Therefore, we arrange them by block number to prioritize the latest
	 ** ones and filter out those with null values.
	 *********************************************************************************************/
	useEffect((): void => {
		if (data) {
			const filteredEvents = getLatestNotEmptyEvents(data as TAllowances);
			set_approveEvents(filteredEvents);
		}
	}, [data]);

	/**********************************************************************************************
	 ** Once we've obtained the actual allowances from the blockchain, we proceed to update the
	 ** existing array of allowances and remove any empty allowances from it.
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (!approveEvents || !allAllowances) {
			return;
		}

		const allAllowancesValues = allAllowances.map(item => item.result);

		const _allowances: TAllowances = [];
		for (let i = 0; i < approveEvents.length; i++) {
			_allowances.push({
				...approveEvents[i],
				args: {
					...approveEvents[i].args,
					value: allAllowancesValues[i]
				}
			});
		}

		set_allowances(filterNotEmptyEvents(_allowances));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [`${approveEvents}`, allAllowances]);

	/**********************************************************************************************
	 ** Here, we obtain distinctive tokens based on their token addresses to avoid making
	 ** additional requests for the same tokens.
	 *********************************************************************************************/
	const uniqueTokenAddresses = useMemo(() => {
		const allowanceAddresses = allowances?.map(allowance => allowance.address);
		return [...new Set(allowanceAddresses)];
	}, [allowances]);

	/**********************************************************************************************
	 ** When we fetch allowances, they don't have enough information in them, such as name, symbol
	 ** and decimals. Here we take only unique tokens from all allowances and make a query.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!uniqueTokenAddresses || !allowances || !isDoneWithInitialFetch) {
			return;
		}

		const calls = [];
		for (const token of uniqueTokenAddresses) {
			const from = {abi, address: toAddress(token), chainId: isDev ? chainID : safeChainID};
			calls.push({...from, functionName: 'symbol'});
			calls.push({...from, functionName: 'decimals'});
			if (!isZeroAddress(address)) {
				calls.push({...from, functionName: 'balanceOf', args: [address]});
			}
			calls.push({...from, functionName: 'name'});
		}

		const data = await readContracts(retrieveConfig(), {
			contracts: calls
		});

		const dictionary: {[key: TAddress]: {symbol: string; decimals: number; balanceOf: bigint; name: string}} = {};

		if (data.length < 4) {
			return;
		}

		/******************************************************************************************
		 ** Once we have an array of those additional fields, we form a dictionary
		 ** with key of an address and additional fields as a value.
		 *****************************************************************************************/
		for (let i = 0; i < uniqueTokenAddresses.length; i++) {
			const itterator = i * 4;
			const address = uniqueTokenAddresses[i];
			const symbol = data[itterator].result;
			const decimals = data[itterator + 1].result;
			const balanceOf = data[itterator + 2].result;
			const name = data[itterator + 3].result;

			dictionary[address] = {
				symbol: symbol as string,
				decimals: decimals as number,
				balanceOf: balanceOf as bigint,
				name: name as string
			};
		}
		const _expandedAllowances: TExpandedAllowance[] = [];

		/******************************************************************************************
		 ** Here we're expanding allowances array using the dictionary
		 *****************************************************************************************/
		for (const allowance of allowances) {
			_expandedAllowances.push({
				address: allowance.address,
				args: allowance.args,
				blockNumber: allowance.blockNumber,
				transactionHash: allowance.transactionHash,
				symbol: dictionary[allowance.address].symbol,
				decimals: dictionary[allowance.address].decimals,
				balanceOf: toNormalizedBN(
					dictionary[allowance.address].balanceOf,
					dictionary[allowance.address].decimals
				).normalized,
				name: dictionary[allowance.address].name
			});
		}

		set_expandedAllowances(_expandedAllowances);
	}, [uniqueTokenAddresses, allowances, isDoneWithInitialFetch, chainID, safeChainID, address]);

	/**********************************************************************************************
	 ** When we have our allowances ready to be stored in DB, we chech if there're some allowances
	 ** is array and store them one by one in DB.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (expandedAllowances.length < 1 || !address) {
			return;
		}

		for (const allowance of expandedAllowances) {
			addApproveEventEntry({
				address: allowance.address,
				blockNumber: allowance.blockNumber,
				transactionHash: allowance.transactionHash,
				symbol: allowance.symbol,
				decimals: allowance.decimals,
				chainID: safeChainID,
				owner: allowance.args.owner,
				sender: allowance.args.sender,
				value: allowance.args.value as bigint,
				balanceOf: allowance.balanceOf,
				name: allowance.name
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [expandedAllowances.length]);

	/**********************************************************************************************
	 ** After storing allowances to DB, we update chain-sync entry according to latest allowance
	 ** blockNumber
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!address) {
			return;
		}
		const lastAllowanceBlockNumber = cachedApproveEvents[cachedApproveEvents.length - 1]?.blockNumber;
		updateChainSyncEntry({
			address,
			chainID: chainID,
			blockNumber: lastAllowanceBlockNumber
		});

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cachedApproveEvents.length, safeChainID]);

	const contextValue = useDeepCompareMemo(
		(): TRevokeContext => ({
			allowances: chainFilteredAllowances,
			filteredAllowances,
			dispatchConfiguration: dispatch,
			configuration,
			isDoneWithInitialFetch,
			isLoading,
			fetchTokenToSearch
		}),
		[
			chainFilteredAllowances,
			filteredAllowances,
			fetchTokenToSearch,
			configuration,
			isDoneWithInitialFetch,
			isLoading
		]
	);

	return (
		<RevokeContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</RevokeContext.Provider>
	);
};

export const useAllowances = (): TRevokeContext => {
	const ctx = useContext(RevokeContext);
	if (!ctx) {
		throw new Error('RevokeContext not found');
	}
	return ctx;
};
