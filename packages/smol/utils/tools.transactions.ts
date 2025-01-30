import assert from 'assert';

import {simulateContract, switchChain, waitForTransactionReceipt, writeContract} from '@wagmi/core';
import {toast} from 'react-hot-toast';
import {BaseError} from 'viem';

import {toBigInt} from '@lib/utils/numbers';
import {assertAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {Config, SimulateContractParameters} from '@wagmi/core';
import type React from 'react';
import type {TransactionReceipt} from 'viem';
import type {Connector} from 'wagmi';

export const defaultTxStatus = {none: true, pending: false, success: false, error: false};
const errorTxStatus = {none: false, pending: false, success: false, error: true};
const pendingTxStatus = {none: false, pending: true, success: false, error: false};
const successTxStatus = {none: false, pending: false, success: true, error: false};
const timeout = 3000;

export type TTxStatus = {
	none: boolean;
	pending: boolean;
	success: boolean;
	error: boolean;
	errorMessage?: string;
};
export type TBaseError = {
	name?: string;
	message: string;
};
export type TTxResponse = {
	isSuccessful: boolean;
	receipt?: TransactionReceipt;
	error?: BaseError | unknown;
};

export class Transaction {
	provider: Connector;
	onStatus: React.Dispatch<React.SetStateAction<TTxStatus>>;
	options?: {shouldIgnoreSuccessTxStatusChange: boolean};
	txArgs?: unknown[];
	funcCall: (provider: Connector, ...rest: never[]) => Promise<TTxResponse>;
	successCall?: (receipt?: TransactionReceipt) => Promise<void>;

	constructor(
		provider: Connector,
		funcCall: (provider: Connector, ...rest: never[]) => Promise<TTxResponse>,
		onStatus: React.Dispatch<React.SetStateAction<TTxStatus>>,
		options?: {shouldIgnoreSuccessTxStatusChange: boolean}
	) {
		this.provider = provider;
		this.funcCall = funcCall;
		this.onStatus = onStatus;
		this.options = options;
	}

	populate(...txArgs: unknown[]): Transaction {
		this.txArgs = txArgs;
		return this;
	}

	onSuccess(onSuccess: (receipt?: TransactionReceipt) => Promise<void>): Transaction {
		this.successCall = onSuccess;
		return this;
	}

	onHandleError(error: string): void {
		this.onStatus({...errorTxStatus, errorMessage: error});
		setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
	}

	async perform(): Promise<TTxResponse> {
		this.onStatus(pendingTxStatus);
		try {
			const args = (this.txArgs || []) as never[];
			const {isSuccessful, receipt, error} = await this.funcCall(this.provider, ...args);
			if (isSuccessful) {
				if (this.successCall && receipt) {
					await this.successCall(receipt);
				}
				if (this?.options?.shouldIgnoreSuccessTxStatusChange) {
					return {isSuccessful, receipt};
				}
				this.onStatus(successTxStatus);
				setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
				return {isSuccessful, receipt};
			}
			this.onHandleError((error as TBaseError)?.message || 'Transaction failed');
			return {isSuccessful: false};
		} catch (error) {
			const err = error as BaseError;
			this.onHandleError(err?.shortMessage || err?.message || 'Transaction failed');
			return {isSuccessful: false};
		}
	}
}

export type TWriteTransaction = {
	chainID: number;
	connector: Connector | undefined;
	config: Config;
	contractAddress: TAddress | undefined;
	statusHandler?: (status: typeof defaultTxStatus) => void;
	onTrySomethingElse?: () => Promise<TTxResponse>; //When the abi is incorrect, ex: usdt, we may need to bypass the error and try something else
	shouldDisplaySuccessToast?: boolean;
	shouldDisplayErrorToast?: boolean;
	shouldResetStatus?: boolean;
};

type TPrepareWriteContractConfig = SimulateContractParameters & {
	chainId?: number;
	address: TAddress | undefined;
	confirmation?: number;
};
export async function handleTx(args: TWriteTransaction, props: TPrepareWriteContractConfig): Promise<TTxResponse> {
	const {config, connector, shouldResetStatus = true} = args;
	const {address} = props;

	if (!config || !address || !connector) {
		console.error('Invalid config or connector or address');
		return {isSuccessful: false, error: new Error('Invalid config or connector or address')};
	}

	args.statusHandler?.({...defaultTxStatus, pending: true});

	/*******************************************************************************************
	 ** First, make sure we are using the correct chainID.
	 ******************************************************************************************/
	const chainID = await connector?.getChainId();
	if (chainID !== args.chainID) {
		try {
			await switchChain(config, {chainId: args.chainID});
		} catch (error) {
			if (!(error instanceof BaseError)) {
				console.error(error);
				return {isSuccessful: false, error};
			}
			toast.error(error.shortMessage);
			args.statusHandler?.({...defaultTxStatus, error: true});
			console.error(error);
			return {isSuccessful: false, error};
		}
	}

	/*******************************************************************************************
	 ** Prepare the write contract.
	 ******************************************************************************************/
	assertAddress(props.address, 'contractAddress');
	assert(chainID === args.chainID, 'ChainID mismatch');
	try {
		const simulateContractConfig = await simulateContract(config, {
			...(props as SimulateContractParameters),
			chainId: chainID,
			connector: props.connector,
			address: props.address,
			value: toBigInt(props.value)
		});
		const hash = await writeContract(config, simulateContractConfig.request);
		const receipt = await waitForTransactionReceipt(config, {
			chainId: chainID,
			hash,
			confirmations: props.confirmation || 2
		});

		if (receipt.status === 'success') {
			args.statusHandler?.({...defaultTxStatus, success: true});
		} else if (receipt.status === 'reverted') {
			args.statusHandler?.({...defaultTxStatus, error: true});
		}
		// If shouldDisplaySuccessToast is undefined, we display the toast by default
		if (args.shouldDisplaySuccessToast || args.shouldDisplaySuccessToast === undefined) {
			toast.success('Transaction successful!');
		}
		return {isSuccessful: receipt.status === 'success', receipt};
	} catch (error) {
		if (!(error instanceof BaseError)) {
			console.error(error);
			return {isSuccessful: false, error};
		}

		if (args.onTrySomethingElse) {
			if (
				error.name === 'ContractFunctionExecutionError' &&
				error.shortMessage !== 'User rejected the request.' // We need this because for Arbitrum, rejection is a ContractFunctionExecutionError
			) {
				console.log('onTrySomethingElse');
				return await args.onTrySomethingElse();
			}
		}

		// If shouldDisplayErrorToast is undefined, we display the toast by default
		if (args.shouldDisplayErrorToast || args.shouldDisplayErrorToast === undefined) {
			toast.error(error.shortMessage);
		}
		args.statusHandler?.({...defaultTxStatus, error: true});
		console.error(error);
		return {isSuccessful: false, error};
	} finally {
		if (shouldResetStatus) {
			setTimeout((): void => {
				args.statusHandler?.({...defaultTxStatus});
			}, 3000);
		}
	}
}
