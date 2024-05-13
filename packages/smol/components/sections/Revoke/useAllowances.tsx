import {createContext, useContext, useEffect, useMemo, useReducer, useState} from 'react';
import {isDev} from 'packages/lib/utils/constants';
import {optionalRenderProps, type TOptionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents, isUnlimited} from 'packages/lib/utils/tools.revoke';
import {erc20Abi} from 'viem';
import {useReadContracts} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {toAddress} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useInfiniteApprovalLogs} from '@smolHooks/useInfiniteContractLogs';
import {readContracts} from '@wagmi/core';

import type {
	TAllowances,
	TAllowancesActions,
	TAllowancesConfiguration,
	TAllowancesContext,
	TExpandedAllowance
} from 'packages/lib/utils/types/app.revoke';
import type {ReactElement} from 'react';
import type {Abi} from 'viem';
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

const defaultProps: TAllowancesContext = {
	allowances: null,
	filteredAllowances: null,
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: [],
		tokenToRevoke: undefined,
		unlimitedFilter: null,
		allowancesFilters: initialFilters
	},
	dispatchConfiguration: (): void => undefined,
	isDoneWithInitialFetch: false,
	isLoading: false
};

const configurationReducer = (
	state: TAllowancesConfiguration,
	action: TAllowancesActions
): TAllowancesConfiguration => {
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

const AllowancesContext = createContext<TAllowancesContext>(defaultProps);
export const AllowancesContextApp = (props: {
	children: TOptionalRenderProps<TAllowancesContext, ReactElement>;
}): ReactElement => {
	const {address} = useWeb3();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const [approveEvents, set_approveEvents] = useState<TAllowances | null>(null);
	const [allowances, set_allowances] = useState<TAllowances | null>(null);
	const [expandedAllowances, set_expandedAllowances] = useState<TExpandedAllowance[]>([]);
	const {chainID, safeChainID} = useChainID();
	const {currentNetworkTokenList} = useTokenList();

	/**********************************************************************************************
	 ** We're retrieving an array of addresses from the currentNetworkTokenList, intending to
	 ** obtain allowances for each address in the list. This process allows us to gather allowance
	 ** data for all tokens listed.
	 *********************************************************************************************/

	const tokenAddresses = useMemo(() => {
		return Object.values(currentNetworkTokenList).map(item => item.address);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentNetworkTokenList.length]);

	/**********************************************************************************************
	 ** The allowances vary across different chains, necessitating us to reset the current state
	 *** when the user switches chains.
	 *********************************************************************************************/
	useEffect(() => {
		set_allowances(null);
	}, [chainID, safeChainID]);

	/**********************************************************************************************
	 ** Once we've gathered approval events for the token list, we need to verify if allowances
	 ** still persist on the chain and haven't been utilized by the contract. To achieve this, we
	 ** utilize the allowance function on the ERC20 contract.
	 *********************************************************************************************/
	const {data: allAllowances, isLoading} = useReadContracts({
		contracts: approveEvents?.map(item => {
			return {
				address: item.address,
				abi: erc20Abi,
				functionName: 'allowance',
				chainID: chainID,
				args: [item.args.owner, item.args.sender]
			};
		})
	});

	/**********************************************************************************************
	 ** We sequentially apply filters to the allowances based on the provided filter object. First,
	 ** we check for the presence of the 'unlimited' filter and apply it. Then, we move on to the
	 ** 'asset' filter, ensuring the array is not empty before filtering by assets. The same
	 ** process applies to the 'spender' filter.
	 *********************************************************************************************/
	const filteredAllowances = useDeepCompareMemo(() => {
		const filters = configuration.allowancesFilters;
		return expandedAllowances?.filter(item => {
			if (filters.unlimited.filter === 'unlimited') {
				if (!isUnlimited(item.args.value as bigint)) {
					return false;
				}
			} else if (filters.unlimited.filter === 'limited') {
				if (isUnlimited(item.args.value as bigint)) {
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
	}, [configuration.allowancesFilters, expandedAllowances]);

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
	 ** We utilize a watcher to consistently obtain the latest approval events for the list of
	 ** tokens.
	 *********************************************************************************************/
	const {data, isDoneWithInitialFetch} = useInfiniteApprovalLogs({
		chainID: chainID,
		addresses: tokenAddresses,
		startBlock: 8_928_158n,
		owner: toAddress(address),
		pageSize: 1_000_000n
	});

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
		if (!allowances || !isDoneWithInitialFetch) {
			return;
		}

		const calls: {address: TAddress; abi: Abi; functionName: string; chainId: number}[] = [];
		for (const token of uniqueTokenAddresses) {
			calls.push({abi: erc20Abi, address: token, functionName: 'name', chainId: isDev ? chainID : safeChainID});
			calls.push({abi: erc20Abi, address: token, functionName: 'symbol', chainId: isDev ? chainID : safeChainID});
			calls.push({
				abi: erc20Abi,
				address: token,
				functionName: 'decimals',
				chainId: isDev ? chainID : safeChainID
			});
		}

		const data = await readContracts(retrieveConfig(), {
			contracts: calls
		});

		const dictionary: {[key: TAddress]: {name: string; symbol: string; decimals: number}} = {};

		if (data.length < 3) {
			return;
		}

		/******************************************************************************************
		 ** When we have an array of those additional fields, we form a dictionary
		 ** with key of an address and additional fields as a value.
		 *****************************************************************************************/
		for (let i = 0; i < uniqueTokenAddresses.length; i++) {
			const itterator = i * 3;
			const address = uniqueTokenAddresses[i];
			const name = data[itterator].result;
			const symbol = data[itterator + 1].result;
			const decimals = data[itterator + 2].result;

			dictionary[address] = {name: name as string, symbol: symbol as string, decimals: decimals as number};
		}
		const _expandedAllowances = [];

		/******************************************************************************************
		 ** Here we expand allowances array using the dictionary
		 *****************************************************************************************/
		for (const allowance of allowances) {
			_expandedAllowances.push({
				...allowance,
				name: dictionary[allowance.address].name,
				symbol: dictionary[allowance.address].symbol,
				decimals: dictionary[allowance.address].decimals
			});
		}

		set_expandedAllowances(_expandedAllowances);
	}, [allowances, chainID, isDoneWithInitialFetch, safeChainID, uniqueTokenAddresses]);

	const contextValue = useDeepCompareMemo(
		(): TAllowancesContext => ({
			allowances: expandedAllowances,
			filteredAllowances,
			dispatchConfiguration: dispatch,
			configuration,
			isDoneWithInitialFetch,
			isLoading
		}),
		[expandedAllowances, filteredAllowances, configuration, isDoneWithInitialFetch, isLoading]
	);

	return (
		<AllowancesContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</AllowancesContext.Provider>
	);
};

export const useAllowances = (): TAllowancesContext => {
	const ctx = useContext(AllowancesContext);
	if (!ctx) {
		throw new Error('AllowancesContext not found');
	}
	return ctx;
};
