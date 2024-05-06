import {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {optionalRenderProps, type TOptionalRenderProps} from 'packages/lib/utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents} from 'packages/lib/utils/tools.revoke';
import {erc20Abi, parseAbiItem} from 'viem';
import {useAccount, useReadContracts} from 'wagmi';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {getClient} from '@builtbymom/web3/utils/wagmi';

import type {TAllowances} from 'packages/lib/utils/types/revokeType';
import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';

export type TAllowancesConfiguration = {
	tokenToCheck: TToken | undefined;
	tokensToCheck: TTokenAllowance[] | undefined;
	tokenToRevoke?: TTokenAllowance | undefined;
};

const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);

const parsedApprovalEvent = parseAbiItem(
	'event Approval(address indexed owner, address indexed sender, uint256 value)'
);

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
	const {chainID} = useChainID();
	const {address} = useAccount();
	const [configuration, dispatch] = useReducer(configurationReducer, defaultProps.configuration);
	const [approveEvents, set_approveEvents] = useState<TAllowances | null>(null);
	const [allowances, set_allowances] = useState<TAllowances | null>(null);
	const {safeChainID} = useChainID();

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

	const refreshApproveEvents = useCallback(
		async (tokenAddresses?: TAddress[]): Promise<void> => {
			if (!tokenAddresses) {
				return;
			}
			try {
				const approveEventLogs = await getClient(isDev ? chainID : safeChainID).getLogs({
					address: tokenAddresses,
					event: parsedApprovalEvent,
					args: {
						owner: address
					},
					fromBlock: 1n
				});

				const filteredEvents = getLatestNotEmptyEvents(approveEventLogs as TAllowances);
				set_approveEvents(filteredEvents);
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error refreshing approve events:', error);
				}
			}
		},
		[address, chainID, safeChainID]
	);

	const contextValue = useMemo(
		(): TAllowancesContext => ({
			allowances,
			dispatchConfiguration: dispatch,
			refreshApproveEvents,
			configuration,
			isLoading
		}),
		[allowances, refreshApproveEvents, configuration, isLoading]
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
