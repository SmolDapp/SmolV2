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
	blockHash: TAddress;
	blockNumber: bigint;
	data: TAddress;
	eventName: 'Approval';
	logIndex: number;
	removed: boolean;
	topics: TAddress[];
	transactionHash: TAddress;
	transactionIndex: number;
};
export type TUnlimitedFilter = 'unlimited' | 'limited' | null;
export type TWithBalanceFilter = 'with-balance' | 'without-balance' | null;

export type TAllowancesConfiguration = {
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
};

// Edit when multiple select added
export type TTokenAllowance = Partial<Pick<TToken, 'address' | 'name'>> & {spender?: TAddress};

export type TAllowancesContext = {
	allowances: TExpandedAllowance[] | null | undefined;
	configuration: TAllowancesConfiguration;
	dispatchConfiguration: Dispatch<TAllowancesActions>;
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

export type TAllowancesActions =
	| {type: 'SET_TOKEN_TO_CHECK'; payload: TToken | undefined}
	| {type: 'SET_TOKENS_TO_CHECK'; payload: TTokenAllowance[] | undefined}
	| {type: 'SET_TOKEN_TO_REVOKE'; payload: TTokenAllowance | undefined}
	| {type: 'SET_FILTER'; payload: TAllowancesFilters};
