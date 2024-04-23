import {encodeFunctionCall} from 'web3-eth-abi';
import {toAddress} from '@builtbymom/web3/utils';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import type {AbiFunctionFragment} from 'web3-types';
import type {TAddress} from '@builtbymom/web3/types';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';

const ERC20ABI_TRANSFER: AbiFunctionFragment = {
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

	return {
		// For other token types, generate a contract tx
		to: token,
		value: '0',
		data: encodeFunctionCall(ERC20ABI_TRANSFER, [recipient, amount])
	};
}
