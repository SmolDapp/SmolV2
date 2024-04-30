import {erc20Abi} from 'viem';
import {assertAddress, MAX_UINT_256, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {handleTx, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {readContract} from '@wagmi/core';

import type {Connector} from 'wagmi';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

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

/******************************************************************************
 ** isApprovedERC20 is a _VIEW_ function that checks if a token is approved for
 ** a spender.
 ******************************************************************************/
type TIsApprovedERC20 = {
	connector: Connector | undefined;
	chainID: number;
	contractAddress: TAddress;
	spenderAddress: TAddress;
	amount?: bigint;
};
export async function isApprovedERC20(props: TIsApprovedERC20): Promise<boolean> {
	const wagmiProvider = await toWagmiProvider(props.connector);
	const result = await readContract(retrieveConfig(), {
		...wagmiProvider,
		abi: erc20Abi,
		chainId: props.chainID,
		address: props.contractAddress,
		functionName: 'allowance',
		args: [wagmiProvider.address, props.spenderAddress]
	});
	return (result || 0n) >= toBigInt(props.amount || MAX_UINT_256);
}

/******************************************************************************
 ** approveERC20 is a _WRITE_ function that approves a token for a spender.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TApproveERC20 = TWriteTransaction & {
	spenderAddress: TAddress | undefined;
	amount: bigint;
};
export async function approveERC20(props: TApproveERC20): Promise<TTxResponse> {
	assertAddress(props.spenderAddress, 'spenderAddress');
	assertAddress(props.contractAddress);

	props.onTrySomethingElse = async (): Promise<TTxResponse> => {
		assertAddress(props.spenderAddress, 'spenderAddress');
		return await handleTx(props, {
			address: toAddress(props.contractAddress),
			chainId: props.chainID,
			abi: ALTERNATE_ERC20_APPROVE_ABI,
			functionName: 'approve',
			confirmation: 1,
			args: [props.spenderAddress, props.amount]
		});
	};

	return await handleTx(props, {
		address: props.contractAddress,
		chainId: props.chainID,
		abi: erc20Abi,
		functionName: 'approve',
		confirmation: 1,
		args: [props.spenderAddress, props.amount]
	});
}
