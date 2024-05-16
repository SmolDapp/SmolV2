import type {Dispatch} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TAddress} from '@builtbymom/web3/types/address';

export type TAllowances = TAllowance[];

export type TAllowance = {
	address: TAddress;
	args: {
		owner: TAddress;
		sender: TAddress;
		value: string | number | bigint | undefined;
	};
	blockNumber: bigint;
};
export type TUnlimitedFilter = 'unlimited' | 'limited' | null;
export type TWithBalanceFilter = 'with-balance' | 'without-balance' | null;

export type TRevokeConfiguration = {
	tokenToCheck: TToken | undefined;
	tokensToCheck: TTokenAllowance[] | undefined;
	tokenToRevoke?: TTokenAllowance | undefined;
	unlimitedFilter?: TUnlimitedFilter;
	allowancesFilters: TAllowancesFilters;
};

export type TExpandedAllowance = TAllowance & {
	name?: string;
	symbol?: string;
	decimals?: number;
	chainID?: number;
};

// Edit when multiple select added
export type TTokenAllowance = Partial<Pick<TToken, 'address' | 'name'>> & {spender?: TAddress};

export type TRevokeContext = {
	allowances: TExpandedAllowance[] | null | undefined;
	configuration: TRevokeConfiguration;
	dispatchConfiguration: Dispatch<TRevokeActions>;
	isDoneWithInitialFetch: boolean;
	filteredAllowances: TExpandedAllowance[] | null | undefined;
	isLoading: boolean;
};

export type TAllowancesFilters = {
	unlimited: {
		filter: TUnlimitedFilter;
	};
	withBalance: {
		filter: TWithBalanceFilter;
	};
	asset: {
		filter: TAddress[];
	};
	spender: {
		filter: TAddress[];
	};
};

export type TRevokeActions =
	| {type: 'SET_TOKEN_TO_CHECK'; payload: TToken | undefined}
	| {type: 'SET_TOKENS_TO_CHECK'; payload: TTokenAllowance[] | undefined}
	| {type: 'SET_TOKEN_TO_REVOKE'; payload: TTokenAllowance | undefined}
	| {type: 'SET_FILTER'; payload: TAllowancesFilters};

/******************************************************************************************
 * The TApproveEventEntry type definition is used in useRevoke context to get allowances
 * for provided token list.
 * The properties are:
 * address: TAddress - Address of a token that is approved
 * chainID: number - Chain ID in which is approve exists
 * owner: TAddress - Owner of tokens that are approved
 * sender: TAddress - Address that has access to approved tokens
 * value: bigint - Amount of approved tokens
 * blockNumber: bigint - The number of the block
 * name?: string - Name of a token that is approved
 * symbol?: string - Symbol of a token that is approved
 * decimals?: number - Decimals of a token that is approved
 ******************************************************************************************/
export type TApproveEventEntry = {
	id?: number;
	address: TAddress;
	chainID: number;
	owner: TAddress;
	sender: TAddress;
	value: bigint;
	blockNumber: bigint;
	name?: string;
	symbol?: string;
	decimals?: number;
};

/******************************************************************************************
 * The TApproveEventChainSyncEntry type definition is used in useRevoke context to be able
 * to merge allowances by block number.
 * The properties are:
 * chainID: number - Chain ID in which is sync happends
 * address: TAddress - Address of a user
 * blockNumber: number - The Number of a last approve event block
 ******************************************************************************************/
export type TApproveEventChainSyncEntry = {
	id?: number;
	chainID: number;
	address: TAddress;
	blockNumber: bigint;
};
