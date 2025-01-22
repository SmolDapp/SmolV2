import {toNormalizedBN} from '@lib/utils/numbers';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {serialize} from '@wagmi/core';
import {isAddress, toAddress} from 'lib/utils/tools.addresses';
import {optionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import {
	getNameDictionaries,
	getUniqueAllowancesBySpender,
	getUniqueAllowancesByToken,
	isUnlimitedBN
} from 'packages/lib/utils/tools.revoke';
import {createContext, useCallback, useContext, useEffect, useReducer, useRef, useState} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';
import {isAddressEqual} from 'viem';
import {useAccount, useChainId, useConfig} from 'wagmi';

import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';
import {useDeepCompareMemo} from '@smolHooks/useDeepCompare';
import {useTokensWithBalance} from '@smolHooks/web3/useTokensWithBalance';
import {useApproveEventsChainSync} from 'packages/smol/app/(apps)/revoke/contexts/useApproveEventsChainSync';
import {useHistoricalAllowances} from 'packages/smol/app/(apps)/revoke/contexts/useHistoricalAllowances';

import type {TOptionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import type {
	TApproveEventEntry,
	TExpandedAllowance,
	TRevokeActions,
	TRevokeConfiguration,
	TRevokeContext
} from 'packages/smol/app/(apps)/revoke/types';
import type {ReactElement} from 'react';

const initialFilters = {
	unlimited: {
		filter: undefined
	},
	withBalance: {
		filter: undefined
	},
	asset: {
		filter: []
	},
	spender: {
		filter: []
	}
};

const defaultProps: TRevokeContext = {
	allowances: undefined,
	filteredAllowances: undefined,
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: [],
		tokenToRevoke: undefined,
		allowancesFilters: initialFilters
	},
	dispatchConfiguration: (): void => undefined,
	isDoneWithInitialFetch: false,
	isLoading: false,
	allowanceFetchingFromBlock: 0n,
	allowanceFetchingToBlock: 0n,
	isLoadingInitialDB: false
};

const configurationReducer = (state: TRevokeConfiguration, action: TRevokeActions): TRevokeConfiguration => {
	switch (action.type) {
		case 'SET_TOKEN_TO_CHECK':
			return {...state, tokenToCheck: action.payload};
		case 'SET_FILTER':
			return {...state, allowancesFilters: action.payload};
		case 'SET_ALLOWANCE_TO_REVOKE':
			return {...state, tokenToRevoke: action.payload};
		case 'RESET_FILTER':
			return {...state, allowancesFilters: initialFilters};
	}
};

const RevokeContext = createContext<TRevokeContext>(defaultProps);
export const RevokeContextApp = (props: {
	children: TOptionalRenderProps<TRevokeContext, ReactElement>;
}): ReactElement => {
	const chainID = useChainId();
	const config = useConfig();
	const {address} = useAccount();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const {listTokensWithBalance, isLoadingOnCurrentChain} = useTokensWithBalance();
	const [chainFilteredAllowances, setChainFilteredAllowances] = useState<TExpandedAllowance[] | undefined>(undefined);
	const [isLoadingInitialDB, setIsLoadingInitialDB] = useState(true);
	const {getAll, add, deleteByID} = useIndexedDBStore<TApproveEventEntry>('approve-events');
	const {currentEntry, updateChainSyncEntry} = useApproveEventsChainSync();
	const currentIdentifier = useRef<string | undefined>(undefined);

	/**********************************************************************************************
	 **This useEffect clears the filters when the user switches the chain.
	 *********************************************************************************************/
	useEffect(() => {
		setIsLoadingInitialDB(true);
		setChainFilteredAllowances(undefined);
		dispatch({type: 'RESET_FILTER'});
	}, [chainID]);

	/**********************************************************************************************
	 ** A callback function that allows us to add entry into approve-events DB
	 *********************************************************************************************/
	const addApproveEventEntry = useCallback(
		async (entry: TApproveEventEntry) => {
			try {
				const entriesFromDB = await getAll();
				const duplicateAllowance = entriesFromDB.find(
					item =>
						isAddressEqual(item.address, entry.address) &&
						isAddressEqual(item.sender, entry.sender) &&
						item.blockNumber === entry.blockNumber &&
						item.logIndex === entry.logIndex &&
						item.transactionIndex === entry.transactionIndex
				);
				if (duplicateAllowance) {
					return;
				}

				const deprecateAllowance = entriesFromDB.find(item => {
					const hasTheSameBlock = entry.blockNumber === item.blockNumber;
					const hasTheSameLogIndex = entry.logIndex === item.logIndex;
					return (
						(isAddressEqual(item.address, entry.address) &&
							isAddressEqual(item.sender, entry.sender) &&
							entry.blockNumber > item.blockNumber) ||
						(hasTheSameBlock && entry.logIndex > item.logIndex) ||
						(hasTheSameBlock && hasTheSameLogIndex && entry.transactionIndex > item.transactionIndex)
					);
				});

				if (deprecateAllowance) {
					await deleteByID(deprecateAllowance.id);
				}

				if (entry.value === 0n) {
					return;
				}
				await add(entry);
			} catch (error) {
				//Do nothing
			}
		},
		[add, getAll, deleteByID]
	);

	/**********************************************************************************************
	 ** This hook is used to fetch historical allowances for the current address. We pass the
	 ** tokenAddresses array to the hook to fetch historical allowances for those tokens.
	 ** We also pass the fromBlock to the hook to fetch historical allowances from that block.
	 ** The fromBlock is retrieved from the indexDB. By default it will be set to -1, meaning the
	 ** fetching will not start until the fromBlock is set to a valid block number (aka indexDB is
	 ** done loading).
	 *********************************************************************************************/
	const {allowances, fromBlock, toBlock, isDoneWithInitialFetch, isLoadingAllowances, getAllowancesForToken} =
		useHistoricalAllowances({
			tokenAddresses: isLoadingOnCurrentChain
				? undefined
				: listTokensWithBalance(chainID).map(item => item.address),
			fromBlock: currentEntry ? currentEntry.blockNumber || 0n : -1n
		});

	/**********************************************************************************************
	 ** This bigass function is used to handle the allowances and process the raw data into a
	 ** more structured format. This function is triggered by the useAsyncTrigger hook with the
	 ** above allowances as main dependencies.
	 ** The identifier pattern is used to ensure that the function is not called multiple times
	 ** with the same data.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!allowances || !chainID || !isAddress(address) || !isDoneWithInitialFetch) {
			return;
		}
		if (allowances.length < 1) {
			setIsLoadingInitialDB(false);
			return;
		}

		/******************************************************************************************
		 ** We are getting a bunch of allowances, we first need to make sure that they are unique.
		 ** We will call the getUniqueAllowancesByToken function to get the unique allowances.
		 *****************************************************************************************/
		const uniqueAllowancesByToken = getUniqueAllowancesByToken(allowances);
		const uniqueAllowancesBySpender = getUniqueAllowancesBySpender(allowances);

		if (
			!uniqueAllowancesByToken ||
			uniqueAllowancesByToken.length < 1 ||
			!uniqueAllowancesBySpender ||
			uniqueAllowancesBySpender.length < 1
		) {
			setIsLoadingInitialDB(false);
			return;
		}

		/******************************************************************************************
		 ** Now, we can set an unique identifier for the current data set. If the identifier is
		 ** the same as the previous one, we will return and not process the data again.
		 ** This will save us some useless computing time
		 *****************************************************************************************/
		const identifier = createUniqueID(serialize({allowances, fromBlock, toBlock}));
		if (currentIdentifier.current === identifier) {
			return;
		}
		currentIdentifier.current = identifier;

		/******************************************************************************************
		 ** For each tokens in our list, we want to know the symbol, decimals, balanceOf and name.
		 ** We will form an array of calls to get this information from the blockchain.
		 **
		 ** TODO @Karlen9 this can be improved by only fetching tokens onces for the same address
		 ** and recomputing the structure later
		 *****************************************************************************************/
		const dictionaries = await getNameDictionaries(
			uniqueAllowancesBySpender,
			uniqueAllowancesByToken,
			address,
			config,
			setIsLoadingInitialDB
		);

		if (!dictionaries) {
			return;
		}

		/******************************************************************************************
		 ** Here we're expanding allowances array using the dictionary, and we are also saving the
		 ** data in the indexedDB.
		 *****************************************************************************************/
		const promises = allowances.map(async allowance => {
			const item = {
				address: allowance.address,
				args: allowance.args,
				blockNumber: allowance.blockNumber,
				symbol: dictionaries?.tokenInfoDictionary[allowance.address]?.symbol,
				decimals: dictionaries?.tokenInfoDictionary[allowance.address]?.decimals,
				balanceOf: toNormalizedBN(
					dictionaries.tokenInfoDictionary[allowance.address]?.balanceOf,
					dictionaries.tokenInfoDictionary[allowance.address]?.decimals
				),
				name: dictionaries.tokenInfoDictionary[allowance.address]?.name,
				chainID: allowance.chainID,
				logIndex: allowance.logIndex,
				spenderName: dictionaries.spenderDictionary[allowance.args.sender]?.name
					? dictionaries.spenderDictionary[allowance.args.sender]?.name
					: 'Unknown',
				transactionIndex: allowance.transactionIndex
			};
			return addApproveEventEntry({
				UID: `${item.chainID}_${item.address}_${item.args.sender}_${item.blockNumber}_${item.transactionIndex}`,
				address: item.address,
				blockNumber: item.blockNumber,
				symbol: item.symbol,
				decimals: item.decimals,
				chainID: item.chainID,
				owner: item.args.owner,
				sender: item.args.sender,
				value: item.args.value as bigint,
				balanceOf: item.balanceOf,
				name: item.name,
				logIndex: item.logIndex,
				transactionIndex: item.transactionIndex,
				spenderName: item.spenderName
			});
		});

		await Promise.all(promises);

		/******************************************************************************************
		 ** Now we want to retrieve all the items from the indexedDB and filter them by the
		 ** current address and chainID (aka current user for current chainID) and only deal with
		 ** them.
		 *****************************************************************************************/
		const itemsFromDB = await getAll();

		/******************************************************************************************
		 ** Here we are formatting the allowances to be displayed in the UI.
		 *****************************************************************************************/
		const _formatedAllowances: TExpandedAllowance[] = [];
		for (const allowance of itemsFromDB) {
			_formatedAllowances.push({
				...allowance,
				args: {
					owner: allowance.owner,
					sender: allowance.sender,
					value: allowance.value
				}
			});
		}

		/******************************************************************************************
		 ** And finally we are filtering allowances by address and chainID to show them to user.
		 *****************************************************************************************/
		const filteredAllowances = _formatedAllowances.filter(
			item => isAddressEqual(item.args.owner, address) && item.chainID === chainID
		);
		const lastAllowanceBlockNumber = filteredAllowances[filteredAllowances.length - 1]?.blockNumber || 0n;
		updateChainSyncEntry({address, chainID: chainID, blockNumber: lastAllowanceBlockNumber});
		setChainFilteredAllowances(filteredAllowances);
		setIsLoadingInitialDB(false);
	}, [
		allowances,
		chainID,
		address,
		isDoneWithInitialFetch,
		fromBlock,
		toBlock,
		getAll,
		updateChainSyncEntry,
		addApproveEventEntry,
		config
	]);

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
				if (!isUnlimitedBN(item.args.value as bigint, item.decimals)) {
					return false;
				}
			} else if (filters.unlimited.filter === 'limited') {
				if (isUnlimitedBN(item.args.value as bigint, item.decimals)) {
					return false;
				}
			}

			if (filters.withBalance.filter === 'with-balance') {
				if (item.balanceOf && item.balanceOf.normalized === 0) {
					return false;
				}
			} else if (filters.withBalance.filter === 'without-balance') {
				if (item.balanceOf && item.balanceOf.normalized > 0) {
					return false;
				}
			}

			if (filters.asset.filter.length > 0) {
				if (!filters.asset.filter.includes(item.address)) {
					return false;
				}
			}

			if (filters.spender.filter.length > 0) {
				if (!filters.spender.filter.includes(item.spenderName)) {
					return false;
				}
			}

			return true;
		});
	}, [configuration.allowancesFilters, chainFilteredAllowances]);

	/**********************************************************************************************
	 ** Separate function to fetch approve events for additional tokenToCheck.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		if (!configuration.tokenToCheck || !isAddress(address)) {
			return;
		}
		getAllowancesForToken(toAddress(configuration.tokenToCheck.address), 0n);
	}, [address, configuration.tokenToCheck, getAllowancesForToken]);

	const contextValue = useDeepCompareMemo(
		(): TRevokeContext => ({
			allowances: chainFilteredAllowances,
			filteredAllowances,
			dispatchConfiguration: dispatch,
			configuration,
			isDoneWithInitialFetch,
			isLoading: isLoadingAllowances,
			allowanceFetchingFromBlock: fromBlock || 0n,
			allowanceFetchingToBlock: toBlock || 0n,
			isLoadingInitialDB
		}),
		[
			chainFilteredAllowances,
			filteredAllowances,
			configuration,
			isDoneWithInitialFetch,
			isLoadingAllowances,
			fromBlock,
			toBlock,
			isLoadingInitialDB
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
