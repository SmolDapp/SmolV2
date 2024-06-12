import axios from 'axios';
import {toAddress} from '@builtbymom/web3/utils';

import type {TAddress} from '@builtbymom/web3/types';
import type {TSwapConfiguration} from '@lib/types/app.swap';

type TLifiToken = {
	address: string;
	chainId: number;
	symbol: string;
	decimals: number;
	name: string;
	coinKey: string;
	logoURI: string;
	priceUSD: string;
};
export type TTransactionRequest = {
	data: string;
	to: string;
	value: string;
	from: string;
	chainId: number;
	gasPrice: string;
	gasLimit: string;
};
export type TLifiQuoteResponse = {
	type: string;
	id: string;
	tool: string;
	toolDetails: {
		key: string;
		name: string;
		logoURI: string;
	};
	action: {
		fromToken: TLifiToken;
		fromAmount: string;
		toToken: TLifiToken;
		fromChainId: number;
		toChainId: number;
		slippage: number;
		fromAddress: string;
		toAddress: string;
	};
	estimate: {
		tool: string;
		approvalAddress: string;
		toAmountMin: string;
		toAmount: string;
		fromAmount: string;
		executionDuration: number;
		fromAmountUSD: string;
		toAmountUSD: string;
	};
	integrator: string;
	transactionRequest: TTransactionRequest;
};

export async function getLifiRoutes(params: {
	fromChainID: number;
	toChainID: number;
	fromTokenAddress: TAddress;
	toTokenAddress: TAddress;
	fromAmount: string;
	fromAddress: TAddress;
	toAddress: TAddress;
	slippage: number; // default 0.05 -> 5%
	order: TSwapConfiguration['order'];
	abortController: AbortController;
}): Promise<{result: TLifiQuoteResponse | undefined; error?: string}> {
	try {
		const result = await axios.get('https://li.quest/v1/quote', {
			signal: params.abortController.signal,
			params: {
				fromChain: params.fromChainID,
				toChain: params.toChainID,
				fromToken: params.fromTokenAddress,
				toToken: params.toTokenAddress,
				fromAmount: params.fromAmount,
				fromAddress: params.fromAddress,
				toAddress: params.toAddress,
				slippage: params.slippage,
				order: params.order,
				//Smol configuration
				integrator: 'Smol',
				fee: 0.003,
				referrer: toAddress(process.env.SMOL_ADDRESS_V2)
			}
		});
		return {result: result.data};
	} catch (error) {
		const err = error as Error & {response?: {data?: {message: string}}};
		return {
			result: undefined,
			error:
				err?.response?.data?.message ||
				err?.message ||
				"We are sorry, we couldn't find a route for this transaction. Please try again later."
		};
	}
}

export type TLifiStatusResponse = {
	transactionId: string;
	sending: {
		txHash: string;
		txLink: string;
		amount: string;
		token: TLifiToken;
		chainId: number;
		amountUSD: string;
		value: string;
		timestamp: number;
	};
	receiving: {
		txHash: string;
		txLink: string;
		amount: string;
		token: TLifiToken;
		chainId: number;
		amountUSD: string;
		value: string;
		timestamp: number;
	};
	fromAddress: string;
	toAddress: string;
	tool: string;
	substatus: string;
	status: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED';
	lifiExplorerLink: string;
	substatusMessage: string;
};
export async function getLifiStatus(params: {
	fromChainID: number;
	toChainID: number;
	txHash: string;
}): Promise<TLifiStatusResponse> {
	const result = await axios.get('https://li.quest/v1/status', {
		params: {
			fromChain: params.fromChainID,
			toChain: params.toChainID,
			txHash: params.txHash
		}
	});
	return result.data;
}
