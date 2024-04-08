import assert from 'assert';
import DISPERSE_ABI from 'utils/abi/disperse.abi';
import {erc20Abi, isAddressEqual} from 'viem';
import {assertAddress, toAddress} from '@builtbymom/web3/utils';
import {defaultTxStatus, handleTx, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {sendTransaction, waitForTransactionReceipt} from '@wagmi/core';

import {usdtAbi, usdtAddress} from './abi/usdtAbi';

import type {Abi, BaseError} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

/* 🔵 - Smold App **************************************************************
 ** transferERC20 is a _WRITE_ function that transfers a token to a recipient.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TTransferERC20 = TWriteTransaction & {
	receiverAddress: TAddress | undefined;
	amount: bigint;
};

// TODO: move to lib
export async function transferERC20(props: TTransferERC20): Promise<TTxResponse> {
	assertAddress(props.receiverAddress, 'receiverAddress');
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: isAddressEqual(props.contractAddress, usdtAddress) ? (usdtAbi as Abi) : erc20Abi,
		functionName: 'transfer',
		args: [props.receiverAddress, props.amount]
	});
}

/* 🔵 - Smold App **************************************************************
 ** transferEther is a _WRITE_ function that transfers ETH to a recipient.
 ** Here, ETH represents the chain's native coin.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TTransferEther = Omit<TWriteTransaction, 'contractAddress'> & {
	receiverAddress: TAddress | undefined;
	amount: bigint;
	shouldAdjustForGas?: boolean;
};

// TODO: Move to lib
export async function transferEther(props: TTransferEther): Promise<TTxResponse> {
	assertAddress(props.receiverAddress, 'receiverAddress');

	props.statusHandler?.({...defaultTxStatus, pending: true});
	const wagmiProvider = await toWagmiProvider(props.connector);

	assertAddress(wagmiProvider.address, 'userAddress');
	try {
		const hash = await sendTransaction(retrieveConfig(), {
			...wagmiProvider,
			to: props.receiverAddress,
			value: props.amount
		});
		const receipt = await waitForTransactionReceipt(retrieveConfig(), {chainId: wagmiProvider.chainId, hash});
		if (receipt.status === 'success') {
			props.statusHandler?.({...defaultTxStatus, success: true});
		} else if (receipt.status === 'reverted') {
			props.statusHandler?.({...defaultTxStatus, error: true});
		}
		return {isSuccessful: receipt.status === 'success', receipt};
	} catch (error) {
		console.error(error);
		const errorAsBaseError = error as BaseError;
		props.statusHandler?.({...defaultTxStatus, error: true});
		return {isSuccessful: false, error: errorAsBaseError || ''};
	} finally {
		setTimeout((): void => {
			props.statusHandler?.({...defaultTxStatus});
		}, 3000);
	}
}

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
		functionName: 'disperseToken',
		args: [props.tokenToDisperse, props.receivers, props.amounts]
	});
}
