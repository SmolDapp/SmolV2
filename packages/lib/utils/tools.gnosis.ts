import abiCoder from 'web3-eth-abi';
import {ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';

import type {AbiCoder} from 'web3-eth-abi';
import type {AbiItem} from 'web3-utils';
import type {TAddress} from '@builtbymom/web3/types';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';

const ERC20ABI_TRANSFER: AbiItem = {
	constant: false,
	payable: false,
	name: 'transfer',
	type: 'function',
	stateMutability: 'nonpayable',
	inputs: [
		{name: '_to', type: 'address'},
		{name: '_value', type: 'uint256'}
	],
	outputs: [{name: '', type: 'bool'}]
};

export function getTransferTransaction(amount: string, token: TAddress, recipient: string): BaseTransaction {
	if (token === toAddress(ETH_TOKEN_ADDRESS)) {
		return {to: recipient, value: amount, data: '0x'};
	}

	const coder = abiCoder as unknown as AbiCoder;
	return {
		// For other token types, generate a contract tx
		to: token,
		value: '0',
		data: coder.encodeFunctionCall(ERC20ABI_TRANSFER, [recipient, amount])
	};
}

const ERC20ABI_APPROVE: AbiItem = {
	type: 'function',
	name: 'approve',
	stateMutability: 'nonpayable',
	inputs: [
		{
			name: 'spender',
			type: 'address'
		},
		{
			name: 'amount',
			type: 'uint256'
		}
	],
	outputs: [
		{
			name: '',
			type: 'bool'
		}
	]
};

export function getApproveTransaction(amount: string, token: TAddress, spender: TAddress): BaseTransaction {
	const coder = abiCoder as unknown as AbiCoder;

	return {
		to: token,
		value: '0',
		data: coder.encodeFunctionCall(ERC20ABI_APPROVE, [spender, amount])
	};
}

const VAULT_ABI: AbiItem = {
	stateMutability: 'nonpayable',
	type: 'function',
	name: 'deposit',
	inputs: [
		{
			name: '_amount',
			type: 'uint256'
		},
		{
			name: 'recipient',
			type: 'address'
		}
	],
	outputs: [
		{
			name: '',
			type: 'uint256'
		}
	]
};

export function getDepositTransaction(contractAddress: TAddress, amount: string, owner: TAddress): BaseTransaction {
	const coder = abiCoder as unknown as AbiCoder;

	return {
		to: contractAddress,
		value: '0',
		data: coder.encodeFunctionCall(VAULT_ABI, [amount, owner])
	};
}
