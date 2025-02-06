import {readContract} from '@wagmi/core';
import {erc20Abi, zeroAddress} from 'viem';

import {zeroNormalizedBN} from '@lib/utils/numbers';
import {assertAddress, toAddress} from '@lib/utils/tools.addresses';
import {handleTx} from '@lib/utils/tools.transactions';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TTxResponse, TWriteTransaction} from '@lib/utils/tools.transactions';
import type {Config} from 'wagmi';

//Because USDT do not return a boolean on approve, we need to use this ABI
const ALTERNATE_ERC20_APPROVE_ABI = [
	{
		constant: false,
		inputs: [
			{name: '_spender', type: 'address'},
			{name: '_value', type: 'uint256'}
		],
		name: 'approve',
		outputs: [],
		payable: false,
		stateMutability: 'nonpayable',
		type: 'function'
	}
] as const;

/************************************************************************************************
 ** TERC20Token represents the basic structure of an ERC20 token
 ** Contains essential token information including:
 ** - address: The contract address of the token
 ** - name: The full name of the token (e.g., "Ethereum")
 ** - symbol: The token symbol (e.g., "ETH")
 ** - decimals: Number of decimal places the token uses (typically 18)
 ** - chainID: The network chain ID where the token exists
 ** - logoURI: Optional URL for the token's logo image
 ************************************************************************************************/
export type TERC20Token = {
	address: TAddress;
	name: string;
	symbol: string;
	decimals: number;
	chainID: number;
	logoURI?: string;
};

/************************************************************************************************
 ** TERC20TokenList defines the structure for a standard token list format
 ** Compatible with the Token Lists standard (https://tokenlists.org/)
 ** Used for importing and managing collections of tokens across different chains
 ** Contains metadata about the list itself and an array of token definitions
 ************************************************************************************************/
export type TERC20TokenList = {
	name: string;
	description: string;
	timestamp: string;
	logoURI: string;
	uri: string;
	keywords: string[];
	version: {
		major: number;
		minor: number;
		patch: number;
	};
	tokens: (Omit<TERC20Token, 'chainID'> & {chainId: number})[];
};

/************************************************************************************************
 ** TERC20TokensWithBalance extends TERC20Token to include balance information
 ** Adds two additional fields to the base token information:
 ** - value: The fiat value of the token balance
 ** - balance: The normalized token balance as a TNormalizedBN
 ************************************************************************************************/
export type TERC20TokensWithBalance = TERC20Token & {
	value: number;
	balance: TNormalizedBN;
};

/************************************************************************************************
 ** TChainERC20Tokens represents a mapping of token balances across multiple chains
 ** Structure: {chainId: {tokenAddress: TokenWithBalance}}
 ** Used to track token balances across different networks in a nested object structure
 ************************************************************************************************/
export type TChainERC20Tokens = Record<number, Record<TAddress, TERC20TokensWithBalance>>;

/************************************************************************************************
 ** DEFAULT_ERC20 provides a default empty state for an ERC20 token with balance
 ** Used as a fallback or initial state when working with token data
 ** Contains zero values and empty strings for all required fields
 ************************************************************************************************/
export const DEFAULT_ERC20: TERC20TokensWithBalance = {
	address: zeroAddress,
	name: '',
	symbol: '',
	decimals: 18,
	chainID: 1,
	value: 0,
	balance: zeroNormalizedBN
};

/*******************************************************************************
 ** approveERC20 is a _WRITE_ function that approves a token for a spender.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TApproveERC20 = TWriteTransaction & {
	spenderAddress: TAddress | undefined;
	amount: bigint;
	confirmation?: number;
};
export async function approveERC20(props: TApproveERC20): Promise<TTxResponse> {
	assertAddress(props.spenderAddress, 'spenderAddress');
	assertAddress(props.contractAddress, 'contractAddress');

	props.onTrySomethingElse = async (): Promise<TTxResponse> => {
		const propsWithoutOnTrySomethingElse = {...props, onTrySomethingElse: undefined};
		assertAddress(props.spenderAddress, 'spenderAddress');
		return await handleTx(propsWithoutOnTrySomethingElse, {
			address: toAddress(props.contractAddress),
			abi: ALTERNATE_ERC20_APPROVE_ABI,
			confirmation: props.confirmation ?? (process.env.NODE_ENV === 'development' ? 1 : undefined),
			functionName: 'approve',
			args: [props.spenderAddress, props.amount]
		});
	};

	return await handleTx(props, {
		address: props.contractAddress,
		abi: erc20Abi,
		confirmation: props.confirmation ?? (process.env.NODE_ENV === 'development' ? 1 : undefined),
		functionName: 'approve',
		args: [props.spenderAddress, props.amount]
	});
}

/*******************************************************************************
 ** transferERC20 is a _WRITE_ function that transfers a token to a recipient.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TTransferERC20 = TWriteTransaction & {
	receiver: TAddress | undefined;
	amount: bigint;
	confirmation?: number;
};

export async function transferERC20(props: TTransferERC20): Promise<TTxResponse> {
	assertAddress(props.receiver, 'receiver');
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: erc20Abi,
		confirmation: props.confirmation ?? (process.env.NODE_ENV === 'development' ? 1 : undefined),
		functionName: 'transfer',
		args: [props.receiver, props.amount]
	});
}

/*******************************************************************************
 ** allowanceOf is a _VIEW_ function that returns the amount of a token that is
 ** approved for a spender.
 ******************************************************************************/
type TAllowanceOf = {
	config: Config;
	chainID: number;
	ownerAddress: TAddress;
	tokenAddress: TAddress;
	spenderAddress: TAddress;
};
export async function allowanceOf(props: TAllowanceOf): Promise<bigint> {
	const result = await readContract(props.config, {
		chainId: props.chainID,
		abi: erc20Abi,
		address: props.tokenAddress,
		functionName: 'allowance',
		args: [props.ownerAddress, props.spenderAddress]
	});
	return result || 0n;
}
