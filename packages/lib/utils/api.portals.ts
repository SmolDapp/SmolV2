import {zeroAddress} from 'viem';
import {z} from 'zod';
import {addressSchema, type TAddress} from '@builtbymom/web3/types';
import {
	ETH_TOKEN_ADDRESS,
	fetch,
	isEthAddress,
	isZero,
	isZeroAddress,
	toAddress,
	toBigInt,
	ZERO_ADDRESS
} from '@builtbymom/web3/utils';

import type {Hex} from 'viem';
import type {TFetchReturn} from '@builtbymom/web3/utils';
import type {TInitSolverArgs} from '@lib/types/solvers';

export const portalsEstimateResponseSchema = z.object({
	outputToken: z.string(),
	outputAmount: z.string(),
	minOutputAmount: z.string(),
	outputTokenDecimals: z.number(),
	context: z.object({
		inputToken: z.string(),
		inputAmount: z.string(),
		inputAmountUsd: z.number(),
		outputToken: z.string(),
		outputAmount: z.string(),
		outputAmountUsd: z.number(),
		minOutputAmountUsd: z.number(),
		slippageTolerancePercentage: z.number()
	})
});

export type TPortalsEstimate = z.infer<typeof portalsEstimateResponseSchema>;

type TGetEstimateProps = {
	params: {
		inputToken: string;
		inputAmount: string;
		outputToken: string;
		slippageTolerancePercentage: string;
		sender?: TAddress;
	};
};

type TGetTransactionProps = Omit<TGetEstimateProps, 'params'> & {
	params: Required<Pick<TGetEstimateProps, 'params'>['params']> & {
		sender: TAddress;
		validate?: string;
		permitDeadline?: string;
		permitSignature?: Hex;
		feePercentage?: string;
	};
};

const portalsTxSchema = z.object({
	to: z.string(),
	from: z.string().optional(),
	data: z.string(),
	value: z.string().optional(),
	gasLimit: z.string().optional()
});

const portalsTransactionSchema = z.object({
	context: z.object({
		feeAmount: z.string(),
		feeAmountUsd: z.number(),
		feeToken: z.string(),
		inputAmount: z.string(),
		inputAmountUsd: z.number(),
		inputToken: z.string(),
		minOutputAmount: z.string(),
		minOutputAmountUsd: z.number(),
		orderId: z.string(),
		outputAmount: z.string(),
		outputAmountUsd: z.number(),
		outputToken: z.string(),
		recipient: z.string(),
		sender: z.string(),
		slippageTolerancePercentage: z.number(),
		target: z.string(),
		value: z.string()
	}),
	tx: portalsTxSchema
});

export type TPortalsTransaction = z.infer<typeof portalsTransactionSchema>;

type TGetApprovalProps = {
	params: {
		sender: TAddress;
		inputToken: string;
		inputAmount: string;
		permitDeadline?: string;
	};
};

const portalsApprovalSchema = z.object({
	context: z.object({
		allowance: z.string(),
		approvalAmount: z.string(),
		canPermit: z.boolean(),
		network: z.string(),
		shouldApprove: z.boolean(),
		spender: addressSchema,
		target: addressSchema
	})
});

export type TPortalsApproval = z.infer<typeof portalsApprovalSchema>;

export const PORTALS_NETWORK = new Map<number, string>([
	[1, 'ethereum'],
	[10, 'optimism'],
	[56, 'bsc'],
	[100, 'gnosis'],
	[137, 'polygon'],
	[250, 'fantom'],
	[8453, 'base'],
	[42161, 'arbitrum'],
	[43114, 'avalanche']
]);

const BASE_URL = 'https://api.portals.fi/v2';

export async function getPortalsEstimate({params}: TGetEstimateProps): Promise<{
	result: TPortalsEstimate | null;
	error: string | undefined;
}> {
	const url = `${BASE_URL}/portal/estimate`;
	params.inputToken = params.inputToken.toLowerCase().replaceAll(ETH_TOKEN_ADDRESS.toLowerCase(), ZERO_ADDRESS);
	params.outputToken = params.outputToken.toLowerCase().replaceAll(ETH_TOKEN_ADDRESS.toLowerCase(), ZERO_ADDRESS);

	const result = await fetch<TPortalsEstimate>({
		endpoint: `${url}?${new URLSearchParams(params)}`,
		schema: portalsEstimateResponseSchema
	});

	if (result.data) {
		result.data.outputToken = result.data.outputToken.toLowerCase().replaceAll(ZERO_ADDRESS, ETH_TOKEN_ADDRESS);
	}

	return {
		result: result.data,
		error: result.error?.message
	};
}

export async function getPortalsTx({params}: TGetTransactionProps): Promise<{
	result: TPortalsTransaction | null;
	error: string | undefined;
}> {
	const url = `${BASE_URL}/portal`;
	params.inputToken = params.inputToken.toLowerCase().replaceAll(ETH_TOKEN_ADDRESS.toLowerCase(), ZERO_ADDRESS);
	params.outputToken = params.outputToken.toLowerCase().replaceAll(ETH_TOKEN_ADDRESS.toLowerCase(), ZERO_ADDRESS);

	const urlParams = new URLSearchParams(params);
	urlParams.delete('permitSignature', 'undefined');
	urlParams.delete('permitDeadline', 'undefined');

	try {
		const result = await fetch<TPortalsTransaction>({
			endpoint: `${url}?${urlParams}`,
			schema: portalsTransactionSchema
		});

		if (result.data) {
			result.data.context.outputToken = result.data.context.outputToken
				.toLowerCase()
				.replaceAll(ZERO_ADDRESS, ETH_TOKEN_ADDRESS);
			result.data.context.inputToken = result.data.context.inputToken
				.toLowerCase()
				.replaceAll(ZERO_ADDRESS, ETH_TOKEN_ADDRESS);
			result.data.context.feeToken = result.data.context.feeToken
				.toLowerCase()
				.replaceAll(ZERO_ADDRESS, ETH_TOKEN_ADDRESS);
		}
		return {
			result: result.data,
			error: result?.error?.message
		};
	} catch (error) {
		console.error(error);
		return {
			result: null,
			error: (error as any)?.message ?? 'An error occured while fetching transaction'
		};
	}
}

export async function getPortalsApproval({params}: TGetApprovalProps): TFetchReturn<TPortalsApproval> {
	const url = `${BASE_URL}/approval`;

	return fetch<TPortalsApproval>({
		endpoint: `${url}?${new URLSearchParams(params)}`,
		schema: portalsApprovalSchema
	});
}

export async function getQuote(
	request: TInitSolverArgs,
	zapSlippage: number
): Promise<{result: TPortalsEstimate | null; error?: string}> {
	const network = PORTALS_NETWORK.get(request.chainID);
	let {inputToken} = request;

	if (isEthAddress(request.inputToken)) {
		inputToken = zeroAddress;
	}
	if (isZeroAddress(request.outputToken)) {
		return {result: null, error: 'Invalid buy token'};
	}
	if (isZero(request.inputAmount)) {
		return {result: null, error: 'Invalid sell amount'};
	}

	return getPortalsEstimate({
		params: {
			inputToken: `${network}:${toAddress(inputToken)}`,
			outputToken: `${network}:${toAddress(request.outputToken)}`,
			inputAmount: toBigInt(request.inputAmount).toString(),
			slippageTolerancePercentage: String(zapSlippage),
			sender: request.from
		}
	});
}
