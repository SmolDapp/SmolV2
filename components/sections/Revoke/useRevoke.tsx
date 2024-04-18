import {createContext, useCallback, useContext, useMemo, useReducer} from 'react';
import {erc20Abi} from 'viem';
import {useAccount, useReadContracts, useWriteContract} from 'wagmi';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {optionalRenderProps} from '@utils/react/optionalRenderProps';
import {filterNotEmptyEvents} from '@utils/tools.revoke';

import {useAllowances} from './useAllowances';

import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';
import type {TOptionalRenderProps} from '@utils/react/optionalRenderProps';
import type {TAllowances} from '@utils/types/revokeType';

export type TRevokeConfiguration = {
	tokenToCheck: TToken | undefined;
	tokensToCheck: TToken[] | undefined;
};

export type TRevoke = {
	refreshAllowances: (tokenAddresses: TAddress[]) => void;
	revokeAllowance: (contractAddress: TAddress, tokenAddress: TAddress, tokenAddresses: TAddress[]) => void;
	allowances: TAllowances | null | undefined;
	isLoading: boolean;
	configuration: TRevokeConfiguration;
	dispatchConfiguration: Dispatch<TRevokeActions>;
};

export type TRevokeActions =
	| {type: 'SET_TOKEN_TO_CHECK'; payload: TToken | undefined}
	| {type: 'RESET'; payload: undefined}
	| {type: 'SET_TOKENS_TO_CHECK'; payload: TToken[] | undefined};

const defaultProps: TRevoke = {
	refreshAllowances: async () => [],
	revokeAllowance: () => {},
	isLoading: false,
	allowances: null,
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: []
	},
	dispatchConfiguration: (): void => undefined
};

const configurationReducer = (state: TRevokeConfiguration, action: TRevokeActions): TRevokeConfiguration => {
	switch (action.type) {
		case 'SET_TOKEN_TO_CHECK':
			return {...state, tokenToCheck: action.payload};
		case 'RESET':
			return {tokenToCheck: undefined, tokensToCheck: undefined};
		case 'SET_TOKENS_TO_CHECK':
			return {...state, tokensToCheck: action.payload ? [...action.payload] : []};
	}
};

const RevokeContext = createContext<TRevoke>(defaultProps);

export const RevokeContextApp = ({children}: {children: TOptionalRenderProps<TRevoke, ReactElement>}): ReactElement => {
	const {chainID} = useChainID();
	const {address} = useAccount();
	const {writeContract} = useWriteContract();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);

	/***************************************************************************
	 **  Getting new approval event logs from blockchain for all provided tokens
	 **************************************************************************/
	const {refreshAllowances, approvalEvents} = useAllowances();

	// Getting all allowances for the events we get from logs
	const {data: allowancesData, isLoading} = useReadContracts({
		contracts: approvalEvents?.map(item => {
			return {
				address: item.address,
				abi: erc20Abi,
				functionName: 'allowance',
				args: [item.args.owner, item.args.sender]
			};
		})
	});

	/***********************************************
	 ** Update logs according to allowances' values
	 ***********************************************/

	const allowances: TAllowances | undefined | null = useMemo(() => {
		if (!approvalEvents) {
			return null;
		}
		if (!allowancesData) {
			return approvalEvents;
		}
		return filterNotEmptyEvents(
			approvalEvents.map((item, index) => {
				return {
					...item,
					args: {
						...item.args,
						value: allowancesData[index].result as bigint
					}
				};
			})
		);
	}, [approvalEvents, allowancesData, refreshAllowances, address, chainID]);

	const onRevokeSuccess = useCallback(
		(tokenAddresses: TAddress[]) => {
			refreshAllowances(tokenAddresses);
		},
		[refreshAllowances]
	);

	// useEffect(() => {
	// 	set_approvalEvents(null);
	// }, [address, chainID]);

	const revokeAllowance = useCallback(
		(tokenAddress: TAddress, contractAddress: TAddress, tokenAddresses: TAddress[]) => {
			writeContract(
				{
					address: tokenAddress,
					abi: erc20Abi,
					functionName: 'approve',
					args: [contractAddress, BigInt(0)]
				},
				{
					onSuccess: () => onRevokeSuccess(tokenAddresses)
				}
			);
		},
		[onRevokeSuccess, writeContract]
	);

	const contextValue = useMemo(
		(): TRevoke => ({
			refreshAllowances,
			allowances,
			dispatchConfiguration: dispatch,
			isLoading,
			configuration,
			revokeAllowance
		}),
		[allowances, isLoading, configuration]
	);

	return (
		<RevokeContext.Provider value={contextValue}>
			{optionalRenderProps(children, contextValue)}
		</RevokeContext.Provider>
	);
};

export const useRevoke = (): TRevoke => {
	const ctx = useContext(RevokeContext);
	if (!ctx) {
		throw new Error('RevokeContext not found');
	}
	return ctx;
};
