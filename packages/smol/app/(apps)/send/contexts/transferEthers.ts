import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {sendTransaction, waitForTransactionReceipt} from '@wagmi/core';
import {assertAddress} from 'lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TTxResponse, TWriteTransaction} from '@lib/utils/tools.transactions';
import type {BaseError} from 'viem';

/***************************************************************
 ** transferEthers is a _WRITE_ function that transfers ETH to a recipient.
 ** Here, ETH represents the chain's native coin.
 **
 ** @param spenderAddress - The address of the spender.
 ** @param amount - The amount of collateral to deposit.
 ******************************************************************************/
type TTransferEther = Omit<TWriteTransaction, 'contractAddress'> & {
	receiver: TAddress | undefined;
	amount: bigint;
	shouldAdjustForGas?: boolean;
	confirmation?: number;
};

export async function transferEthers(props: TTransferEther): Promise<TTxResponse> {
	assertAddress(props.receiver, 'receiver');

	props.statusHandler?.({...defaultTxStatus, pending: true});

	try {
		const hash = await sendTransaction(props.config, {
			connector: props.connector,
			chainId: props.chainID,
			to: props.receiver,
			value: props.amount
		});
		const receipt = await waitForTransactionReceipt(props.config, {
			chainId: props.chainID,
			hash,
			confirmations: props.confirmation ?? (process.env.NODE_ENV === 'development' ? 1 : undefined)
		});
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
