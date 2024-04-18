import {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {erc20Abi, parseAbiItem} from 'viem';
import {useAccount, useReadContracts} from 'wagmi';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {getClient} from '@builtbymom/web3/utils/wagmi';
import {optionalRenderProps} from '@utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents} from '@utils/tools.revoke';

import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';
import type {TOptionalRenderProps} from '@utils/react/optionalRenderProps';
import type {TAllowances} from '@utils/types/revokeType';
import type {TTokenToRevoke} from './Wizard';

export type TAllowancesConfiguration = {
	tokenToCheck: TToken | undefined;
	tokensToCheck: TToken[] | undefined;
	tokenToRevoke?: TTokenToRevoke | undefined;
};

export type TAllowancesContext = {
	allowances: TAllowances | null | undefined;
	isLoading: boolean;
	refreshApproveEvents: (tokenAddresses: TAddress[]) => void;
	configuration: TAllowancesConfiguration;
	dispatchConfiguration: Dispatch<TAllowancesActions>;
};

export type TAllowancesActions =
	| {type: 'SET_TOKEN_TO_CHECK'; payload: TToken | undefined}
	| {type: 'RESET'; payload: undefined}
	| {type: 'SET_TOKENS_TO_CHECK'; payload: TToken[] | undefined}
	| {type: 'SET_TOKEN_TO_REVOKE'; payload: TTokenToRevoke | undefined};

const defaultProps: TAllowancesContext = {
	isLoading: false,
	allowances: null,
	refreshApproveEvents: async () => {},
	configuration: {
		tokenToCheck: undefined,
		tokensToCheck: [],
		tokenToRevoke: undefined
	},
	dispatchConfiguration: (): void => undefined
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

const parsedApprovalEvent = parseAbiItem(
	'event Approval(address indexed owner, address indexed sender, uint256 value)'
);

const AllowancesContext = createContext<TAllowancesContext>(defaultProps);

export const AllowancesContextApp = ({
	children
}: {
	children: TOptionalRenderProps<TAllowancesContext, ReactElement>;
}): ReactElement => {
	const {chainID} = useChainID();
	const {address} = useAccount();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const [approveEvents, set_approveEvents] = useState<TAllowances | null>(null);

	const {safeChainID} = useChainID();

	const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);

	const publicClient = useMemo(() => getClient(isDev ? chainID : safeChainID), [isDev, chainID, safeChainID]);

	// Getting all allowances for the events we get from logs
	const {data: allowancesData, isLoading} = useReadContracts({
		contracts: approveEvents?.map(item => {
			return {
				address: item.address,
				abi: erc20Abi,
				functionName: 'allowance',
				args: [item.args.owner, item.args.sender]
			};
		})
	});

	// Update logs according to allowances' values
	const allowances: TAllowances | null = useMemo(() => {
		if (!approveEvents) {
			return null;
		}
		if (!allowancesData) {
			return approveEvents;
		}
		return filterNotEmptyEvents(
			approveEvents.map((item, index) => {
				return {
					...item,
					args: {
						...item.args,
						value: allowancesData[index].result as bigint
					}
				};
			})
		);
	}, [approveEvents, allowancesData, address, chainID]);

	const refreshApproveEvents = useCallback(
		async (tokenAddresses?: TAddress[]) => {
			if (!tokenAddresses) {
				return;
			}
			try {
				const approveEventLogs = await publicClient.getLogs({
					address: tokenAddresses,
					event: parsedApprovalEvent,
					args: {
						owner: address
					},
					fromBlock: 1n
				});

				// refetch?.();

				const filteredEvents = getLatestNotEmptyEvents(approveEventLogs as TAllowances);
				set_approveEvents(filteredEvents);
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error refreshing approve events:', error);
				}
			}
		},
		[address, publicClient]
	);

	const contextValue = useMemo(
		(): TAllowancesContext => ({
			allowances,
			dispatchConfiguration: dispatch,
			refreshApproveEvents,
			isLoading,
			configuration
		}),
		[allowances, isLoading, configuration]
	);

	return (
		<AllowancesContext.Provider value={contextValue}>
			{optionalRenderProps(children, contextValue)}
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
