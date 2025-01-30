import {encodeFunctionData, erc20Abi} from 'viem';

import {toBigInt} from '@lib/utils/numbers';
import {isEthAddress} from '@lib/utils/tools.addresses';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TAddress} from '@lib/utils/tools.addresses';

export function getTransferTransaction(amount: string, token: TAddress, recipient: TAddress): BaseTransaction {
	if (isEthAddress(token)) {
		return {to: recipient, value: amount, data: '0x'};
	}

	const data = encodeFunctionData({
		abi: erc20Abi,
		functionName: 'transfer',
		args: [recipient, toBigInt(amount)]
	});
	return {
		to: token,
		value: '0',
		data: data
	};
}
