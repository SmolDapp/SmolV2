import {createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState} from 'react';
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
import {useInfiniteApprovalLogs} from '@hooks/useInfiniteContractLogs';
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
		filter: null
	},
	spender: {
		filter: null
	}
};

const defaultProps: TAllowancesContext = {
	allowances: null,
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

	const tokenAddresses = useMemo(() => {
		return Object.values(currentNetworkTokenList).map(item => item.address);
	}, [currentNetworkTokenList]);

	useEffect(() => {
		set_allowances(null);
	}, [chainID, safeChainID]);

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

	const filteredAllowances = useMemo(() => {
		const unlimitedFilter = configuration.allowancesFilters.unlimited.filter;
		return expandedAllowances.filter(item =>
			unlimitedFilter === 'unlimited'
				? isUnlimited(item.args.value as bigint)
				: unlimitedFilter === 'limited'
					? !isUnlimited(item.args.value as bigint)
					: expandedAllowances
		);
	}, [configuration.allowancesFilters.unlimited.filter, expandedAllowances]);

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

	const {data, isDoneWithInitialFetch} = useInfiniteApprovalLogs({
		chainID: chainID,
		addresses: tokenAddresses,
		startBlock: 8_928_158n,
		owner: toAddress(address),
		pageSize: 1_000_000n
	});

	useEffect((): void => {
		if (data) {
			const filteredEvents = getLatestNotEmptyEvents(data as TAllowances);
			set_approveEvents(filteredEvents);
		}
	}, [data]);

	const uniqueTokenAddresses = useMemo(() => {
		const allowanceAddresses = allowances?.map(allowance => allowance.address);
		return [...new Set(allowanceAddresses)];
	}, [allowances]);

	/*********************************************************************************
	 ** When we fetch allowances, they don't have enough information in them, such as
	 ** name, symbol and decimals. Here we take only unique tokens from all allowances
	 ** and make a query.
	 **********************************************************************************/
	const expandAllowances = useCallback(async () => {
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
		/************************************************************************
		 ** When we have an array of those additional fields, we form a dictionary
		 ** with key of an address and additional fields as a value.
		 *************************************************************************/
		for (let i = 0; i < uniqueTokenAddresses.length; i++) {
			const itterator = i * 3;
			const address = uniqueTokenAddresses[i];
			const name = data[itterator].result;
			const symbol = data[itterator + 1].result;
			const decimals = data[itterator + 2].result;

			dictionary[address] = {name: name as string, symbol: symbol as string, decimals: decimals as number};
		}
		const _expandedAllowances = [];

		/********************************************************
		 ** Here we expand allowances array using this dictionary
		 *******************************************************/
		for (const allowance of allowances) {
			_expandedAllowances.push({
				...allowance,
				name: dictionary[allowance.address].name,
				symbol: dictionary[allowance.address].symbol,
				decimals: dictionary[allowance.address].decimals
			});
		}

		set_expandedAllowances(_expandedAllowances);
	}, [allowances, chainID, isDev, isDoneWithInitialFetch, safeChainID, uniqueTokenAddresses]);

	const contextValue = useMemo(
		(): TAllowancesContext => ({
			allowances: filteredAllowances,
			dispatchConfiguration: dispatch,
			configuration,
			isDoneWithInitialFetch,
			isLoading
		}),
		[filteredAllowances, configuration, isDoneWithInitialFetch, isLoading]
	);

	useEffect((): void => {
		if (!allowances) {
			return;
		}
		expandAllowances();
	}, [allowances, expandAllowances]);

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
