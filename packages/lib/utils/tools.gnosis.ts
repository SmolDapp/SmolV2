import abiCoder from 'web3-eth-abi';

import {isEthAddress} from '@lib/utils/tools.addresses';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {AbiItem} from 'web3-utils';

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
	if (isEthAddress(token)) {
		return {to: recipient, value: amount, data: '0x'};
	}

	const coder = abiCoder;
	return {
		// For other token types, generate a contract tx
		to: token,
		value: '0',
		data: coder.encodeFunctionCall(ERC20ABI_TRANSFER as any, [recipient, amount])
	};
}
