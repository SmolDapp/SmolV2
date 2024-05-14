import assert from 'assert';
import {assertAddress, toAddress} from '@builtbymom/web3/utils';
import {handleTx} from '@builtbymom/web3/utils/wagmi';
import DISPERSE_ABI from '@lib/utils/abi/disperse.abi';

import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

/* 🔵 - Smold App **************************************************************
 ** disperseETH is a _WRITE_ function that disperses ETH to a list of addresses.
 **
 ** @param receivers - The addresses of the receivers.
 ** @param amounts - The amounts of ETH to send to each receiver.
 ******************************************************************************/
type TDisperseETH = TWriteTransaction & {
	receivers: TAddress[];
	amounts: bigint[];
};
export async function disperseETH(props: TDisperseETH): Promise<TTxResponse> {
	assertAddress(props.contractAddress);
	for (const receiver of props.receivers) {
		assertAddress(receiver, receiver);
	}
	for (const amount of props.amounts) {
		assert(amount > 0n, 'amount must be greater than 0');
	}
	assert(props.receivers.length === props.amounts.length, 'receivers and amounts must be the same length');

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: DISPERSE_ABI,
		functionName: 'disperseEther',
		confirmation: process.env.NODE_ENV === 'development' ? 1 : undefined,
		args: [props.receivers, props.amounts],
		value: props.amounts.reduce((a, b): bigint => a + b, 0n)
	});
}

/* 🔵 - Smold App **************************************************************
 ** disperseERC20 is a _WRITE_ function that disperses ERC20 to a list of
 ** addresses.
 **
 ** @param receivers - The addresses of the receivers.
 ** @param amounts - The amounts of ETH to send to each receiver.
 ******************************************************************************/
type TDisperseERC20 = TWriteTransaction & {
	tokenToDisperse: TAddress | undefined;
	receivers: TAddress[];
	amounts: bigint[];
};
export async function disperseERC20(props: TDisperseERC20): Promise<TTxResponse> {
	assertAddress(props.tokenToDisperse, 'The tokenToDisperse');
	assertAddress(props.contractAddress);
	for (const receiver of props.receivers) {
		assertAddress(receiver, receiver);
	}
	for (const amount of props.amounts) {
		assert(amount > 0n, 'amount must be greater than 0');
	}
	assert(props.receivers.length === props.amounts.length, 'receivers and amounts must be the same length');

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: DISPERSE_ABI,
		confirmation: process.env.NODE_ENV === 'development' ? 1 : undefined,
		functionName: 'disperseToken',
		args: [props.tokenToDisperse, props.receivers, props.amounts]
	});
}
