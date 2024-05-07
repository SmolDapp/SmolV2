import {createContext, useContext, useEffect, useMemo, useReducer, useState} from 'react';
import {optionalRenderProps, type TOptionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents} from 'packages/lib/utils/tools.revoke';
import {erc20Abi} from 'viem';
import {useReadContracts} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {toAddress} from '@builtbymom/web3/utils';
import {useInfiniteApprovalLogs} from '@hooks/useInfiniteContractLogs';

import type {TAllowances} from 'packages/lib/utils/types/revokeType';
import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';

export type TAllowancesConfiguration = {
	tokenToCheck: TToken | undefined;
	tokensToCheck: TTokenAllowance[] | undefined;
	tokenToRevoke?: TTokenAllowance | undefined;
};

// Edit when multiple select added
export type TTokenAllowance = Partial<Pick<TToken, 'address' | 'name'>> & {spender?: TAddress};

export type TAllowancesContext = {
	allowances: TAllowances | null | undefined;
	refreshApproveEvents: (tokenAddresses: TAddress[]) => void;
	configuration: TAllowancesConfiguration;
	dispatchConfiguration: Dispatch<TAllowancesActions>;
	isLoading: boolean;
};

export type TAllowancesActions =
	| {type: 'SET_TOKEN_TO_CHECK'; payload: TToken | undefined}
	| {type: 'RESET'; payload: undefined}
	| {type: 'SET_TOKENS_TO_CHECK'; payload: TTokenAllowance[] | undefined}
	| {type: 'SET_TOKEN_TO_REVOKE'; payload: TTokenAllowance | undefined};

const defaultProps: TAllowancesContext = {
	allowances: null,
	refreshApproveEvents: async () => {},
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: [],
		tokenToRevoke: undefined
	},
	dispatchConfiguration: (): void => undefined,
	isLoading: false
};

const configurationReducer = (
	state: TAllowancesConfiguration,
	action: TAllowancesActions
): TAllowancesConfiguration => {
	switch (action.type) {
		case 'SET_TOKEN_TO_CHECK':
			return {...state, tokenToCheck: action.payload};
		case 'RESET':
			return {tokenToCheck: undefined, tokensToCheck: undefined};
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
	const {safeChainID} = useChainID();
	const {currentNetworkTokenList} = useTokenList();

	const tokenAddresses = useMemo(() => {
		return Object.values(currentNetworkTokenList).map(item => item.address);
	}, [currentNetworkTokenList]);

	const {data: allAllowances, isLoading} = useReadContracts({
		contracts: approveEvents?.map(item => {
			return {
				address: item.address,
				abi: erc20Abi,
				functionName: 'allowance',
				args: [item.args.owner, item.args.sender]
			};
		})
	});

	useAsyncTrigger(async (): Promise<void> => {
		if (!approveEvents || !allAllowances) {
			set_allowances(null);
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

	const {data} = useInfiniteApprovalLogs({
		chainID: safeChainID,
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

	const contextValue = useMemo(
		(): TAllowancesContext => ({
			allowances,
			dispatchConfiguration: dispatch,
			refreshApproveEvents: (): void => undefined,
			configuration,
			isLoading
		}),
		[allowances, configuration, isLoading]
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
