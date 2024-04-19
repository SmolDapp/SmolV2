import {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {parseAbiItem} from 'viem';
import {useAccount} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {allowanceOf, getClient} from '@builtbymom/web3/utils/wagmi';
import {useUpdateEffect} from '@react-hookz/web';
import {optionalRenderProps} from '@utils/react/optionalRenderProps';
import {filterNotEmptyEvents, getLatestNotEmptyEvents} from '@utils/tools.revoke';

import type {Dispatch, ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';
import type {TOptionalRenderProps} from '@utils/react/optionalRenderProps';
import type {TAllowances} from '@utils/types/revokeType';

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
	const {provider} = useWeb3();
	const [allowances, set_allowances] = useState<TAllowances | null>(null);

	const {safeChainID} = useChainID();

	const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);

	const publicClient = useMemo(() => getClient(isDev ? chainID : safeChainID), [isDev, chainID, safeChainID]);

	const allowancePromises = useMemo(() => {
		if (!approveEvents) {
			return [];
		}
		return approveEvents.map(async item =>
			allowanceOf({
				connector: provider,
				chainID: chainID,
				tokenAddress: item.address,
				spenderAddress: item.args.sender
			})
		);
	}, [approveEvents, chainID, provider]);

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

	useUpdateEffect(() => {
		Promise.all(allowancePromises).then(allowance => {
			return set_allowances(
				filterNotEmptyEvents(
					approveEvents
						? approveEvents.map((item, index) => {
								return {
									...item,
									args: {
										...item.args,
										value: allowance[index]
									}
								};
							})
						: []
				)
			);
		});
	}, [approveEvents, refreshApproveEvents]);

	const contextValue = useMemo(
		(): TAllowancesContext => ({
			allowances,
			dispatchConfiguration: dispatch,
			refreshApproveEvents,
			configuration
		}),
		[allowances, refreshApproveEvents, configuration]
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
