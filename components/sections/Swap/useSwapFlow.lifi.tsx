import React, {createContext, useCallback, useContext, useMemo, useReducer, useState} from 'react';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {
	allowanceOf,
	approveERC20,
	defaultTxStatus,
	getNetwork,
	retrieveConfig,
	toWagmiProvider
} from '@builtbymom/web3/utils/wagmi';
import {optionalRenderProps} from '@utils/react/optionalRenderProps';
import {defaultInputAddressLike} from '@utils/tools.address';
import {createUniqueID} from '@utils/tools.identifiers';
import {estimateGas, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';

import {getLifiRoutes, getLifiStatus} from './api.lifi';

import type {TTokenAmountInputElement} from 'components/designSystem/SmolTokenAmountInput';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {Hex} from 'viem';
import type {TUseBalancesTokens} from '@builtbymom/web3/hooks/useBalances.multichains';
import type {TChainTokens, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TOptionalRenderProps} from '@utils/react/optionalRenderProps';
import type {TSwapActions, TSwapConfiguration, TSwapContext} from '@utils/types/app.swap';
import type {TLifiQuoteResponse} from './api.lifi';

type TLastSolverFetchData = {
	inputToken: string;
	outputToken: string;
	inputAmount: string;
	slippageTolerancePercentage: string;
	time: number;
};

export function getNewInputToken(): TTokenAmountInputElement {
	return {
		amount: '',
		value: 0,
		normalizedBigAmount: zeroNormalizedBN,
		isValid: 'undetermined',
		token: undefined,
		status: 'none',
		UUID: crypto.randomUUID()
	};
}

const defaultProps: TSwapContext = {
	configuration: {
		receiver: defaultInputAddressLike,
		input: getNewInputToken(),
		output: getNewInputToken(),
		slippageTolerance: 2.5
	},
	isFetchingQuote: false,
	isValid: false,
	currentError: undefined,
	retrieveExpectedOut: async (): Promise<void> => undefined,
	dispatchConfiguration: (): void => undefined,
	hasSolverAllowance: async (): Promise<boolean> => false,
	approveSolverSpender: async (): Promise<boolean> => false,
	performSolverSwap: async (): Promise<boolean> => false
};

const swapReducer = (state: TSwapConfiguration, action: TSwapActions): TSwapConfiguration => {
	switch (action.type) {
		case 'SET_RECEIVER':
			return {...state, receiver: {...state.receiver, ...action.payload}};
		case 'SET_INPUT':
			return {...state, input: action.payload ? action.payload : getNewInputToken()};
		case 'SET_INPUT_VALUE':
			if (state.input.token?.address === action.payload.token?.address) {
				return {...state, input: {...state.input, ...action.payload}};
			}
			return {
				...state,
				input: {
					...state.input,
					...action.payload,
					amount: !action.payload.amount
						? action.payload.token?.balance.display || ''
						: action.payload.amount,
					normalizedBigAmount: !action.payload.normalizedBigAmount
						? action.payload.token?.balance || zeroNormalizedBN
						: action.payload.normalizedBigAmount,
					value: action.payload.value || undefined
				}
			};
		case 'SET_OUTPUT_VALUE':
			return {...state, output: {...state.output, ...action.payload}};
		case 'SET_SLIPPAGE':
			return {...state, slippageTolerance: action.payload};
		case 'INVERSE_TOKENS':
			return {
				...state,
				input: {
					...state.output,
					amount: state.output.token?.balance.display || '',
					normalizedBigAmount: state.output.token?.balance || zeroNormalizedBN
				},
				output: {
					...state.input,
					amount: state.input.token?.balance.display || '',
					normalizedBigAmount: state.input.token?.balance || zeroNormalizedBN
				}
			};
		case 'RESET_INPUT':
			return {
				...state,
				input: getNewInputToken(),
				output: {
					...state.output,
					amount: '',
					value: undefined,
					normalizedBigAmount: zeroNormalizedBN
				}
			};
		case 'RESET_OUTPUT':
			return {...state, output: getNewInputToken()};
		case 'RESET':
			return defaultProps.configuration;
	}
};

/**********************************************************************************************
 ** Assert that the last fetch was not the same as the current configuration, and it was not
 ** too recent. If it was, return false, otherwise update the last fetch data and return true.
 ** This is to prevent spamming the API with the same request.
 *********************************************************************************************/
let currentIdentifier: string | undefined = undefined;
let lastFetch: TLastSolverFetchData = {
	inputToken: '',
	outputToken: '',
	inputAmount: '',
	slippageTolerancePercentage: '',
	time: 0
};
function assertLastSolverFetch(configuration: TSwapConfiguration): boolean {
	if (!configuration.input.token || !configuration.output.token) {
		return false;
	}

	if (
		lastFetch &&
		lastFetch.inputToken === configuration.input.token.address &&
		lastFetch.outputToken === configuration.output.token.address &&
		lastFetch.inputAmount === configuration.input.normalizedBigAmount.display &&
		lastFetch.slippageTolerancePercentage === '2.5' &&
		Date.now() - lastFetch.time < 60000
	) {
		return false;
	}

	lastFetch = {
		inputToken: configuration.input.token.address,
		outputToken: configuration.output.token.address,
		inputAmount: configuration.input.normalizedBigAmount.display,
		slippageTolerancePercentage: '2.5',
		time: Date.now()
	};
	return true;
}

const SwapContext = createContext<TSwapContext>(defaultProps);
export const SwapContextApp = (props: {children: TOptionalRenderProps<TSwapContext, ReactElement>}): ReactElement => {
	const {address, provider, chainID} = useWeb3();
	const {onRefresh} = useWallet();
	const [configuration, dispatch] = useReducer(swapReducer, defaultProps.configuration);
	const [isFetchingQuote, set_isFetchingQuote] = useState<boolean>(false);
	const [currentTxRequest, set_currentTxRequest] = useState<TLifiQuoteResponse | undefined>(undefined);
	const [currentError, set_currentError] = useState<string | undefined>(undefined);

	/**********************************************************************************************
	 ** onRefreshSolverBalances will refresh the balances of the input and output tokens. It will
	 ** also refresh the balance of the native token of the input token chain.
	 ** This is triggered after a successful swap.
	 *********************************************************************************************/
	const onRefreshSolverBalances = useCallback(
		async (inputToken: TToken, outputToken: TToken): Promise<TChainTokens> => {
			const inputTokenChainID = inputToken.chainID;
			const chainCoin = getNetwork(inputTokenChainID).nativeCurrency;
			const tokensToRefresh: TUseBalancesTokens[] = [
				{
					address: ETH_TOKEN_ADDRESS,
					decimals: chainCoin?.decimals || 18,
					symbol: chainCoin?.symbol || 'ETH',
					name: chainCoin?.name || 'Ether',
					chainID: chainID
				}
			];

			if (!isZeroAddress(inputToken.address)) {
				tokensToRefresh.push(inputToken);
			}

			if (!isZeroAddress(outputToken.address)) {
				tokensToRefresh.push(outputToken);
			}

			const updatedBalances = await onRefresh(tokensToRefresh);
			return updatedBalances;
		},
		[chainID, onRefresh]
	);

	/**********************************************************************************************
	 ** retrieveExpectedOut will get the expected output amount and value from the Portals API. It
	 ** will check if the input token, output token, and input amount are valid. If they are, it
	 ** will get the expected output amount and value from the API.
	 *********************************************************************************************/
	const handleQuoteResponse = useCallback(
		(result: TLifiQuoteResponse, expectedIdentifier: string): void => {
			const decimals = configuration.output.token?.decimals || 18;
			const out = toNormalizedBN(toBigInt(result.estimate.toAmountMin), decimals);
			if (currentIdentifier !== expectedIdentifier) {
				return;
			}
			set_isFetchingQuote(false);
			set_currentTxRequest(result);
			dispatch({
				type: 'SET_OUTPUT_VALUE',
				payload: {
					...configuration.output,
					amount: out.display,
					value: Number(result.estimate.toAmountUSD),
					normalizedBigAmount: out,
					isValid: true,
					error: undefined
				}
			});
			dispatch({
				type: 'SET_INPUT_VALUE',
				payload: {
					...configuration.input,
					value: Number(result.estimate.fromAmountUSD)
				}
			});
		},
		[configuration.input, configuration.output]
	);
	const retrieveExpectedOut = useAsyncTrigger(async (): Promise<void> => {
		const hasValidInValue = configuration.input.normalizedBigAmount.raw > 0n;
		const hasValidIn = Boolean(configuration.input.token && !isZeroAddress(configuration.input.token.address));
		const hasValidOut = Boolean(configuration.output.token && !isZeroAddress(configuration.output.token.address));

		if (hasValidIn && hasValidOut && hasValidInValue) {
			if (!assertLastSolverFetch(configuration)) {
				return;
			}

			const identifier = createUniqueID(serialize(configuration));
			currentIdentifier = identifier;

			set_isFetchingQuote(true);
			dispatch({
				type: 'SET_OUTPUT_VALUE',
				payload: {
					...configuration.output,
					amount: undefined,
					value: 0,
					normalizedBigAmount: zeroNormalizedBN,
					isValid: false,
					error: undefined
				}
			});

			set_currentTxRequest(undefined);
			const {result, error} = await getLifiRoutes({
				fromAddress: toAddress(address),
				toAddress: toAddress(address),
				fromAmount: toBigInt(configuration.input.normalizedBigAmount.raw).toString(),
				fromChainID: configuration.input.token?.chainID || -1,
				fromTokenAddress: toAddress(configuration.input.token?.address),
				toChainID: configuration.output.token?.chainID || -1,
				toTokenAddress: toAddress(configuration.output.token?.address),
				slippage: 0.05
			});

			if (result) {
				handleQuoteResponse(result, identifier);
				set_currentError(undefined);
			} else {
				set_currentError(error);
				set_isFetchingQuote(false);
			}
		}
	}, [address, configuration, handleQuoteResponse]);

	/**********************************************************************************************
	 ** hasSolverAllowance checks if the user has enough allowance to perform the swap. It will
	 ** check the allowance of the input token to the contract that will perform the swap, contract
	 ** which is provided by the Portals API.
	 *********************************************************************************************/
	const hasSolverAllowance = useCallback(async (): Promise<boolean> => {
		if (!currentTxRequest || !configuration.input.token || !configuration.output.token) {
			return false;
		}

		const fromChainID = currentTxRequest.action.fromChainId;
		const spender = currentTxRequest.estimate.approvalAddress;
		const tokenToSpend = currentTxRequest.action.fromToken.address;
		const amount = currentTxRequest.action.fromAmount;

		if (toBigInt(amount) === 0n) {
			return false;
		}
		if (isEthAddress(tokenToSpend) || isZeroAddress(tokenToSpend)) {
			return true;
		}

		const allowance = await allowanceOf({
			connector: provider,
			chainID: fromChainID,
			tokenAddress: toAddress(tokenToSpend),
			spenderAddress: toAddress(spender)
		});

		console.log({allowance});
		return allowance >= toBigInt(amount);
	}, [configuration.input.token, configuration.output.token, currentTxRequest, provider]);

	/**********************************************************************************************
	 ** approveSolverSpender will approve the contract that will perform the swap to spend the
	 ** input token. It will use the Portals API to get the contract address and the amount to
	 ** approve.
	 *********************************************************************************************/
	const approveSolverSpender = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus>>): Promise<boolean> => {
			if (!currentTxRequest || !configuration.input.token || !configuration.output.token) {
				return false;
			}

			const fromChainID = currentTxRequest.action.fromChainId;
			const spender = currentTxRequest.estimate.approvalAddress;
			const tokenToSpend = currentTxRequest.action.fromToken.address;
			const amount = currentTxRequest.action.fromAmount;
			if (toBigInt(amount) === 0n) {
				return false;
			}
			if (isEthAddress(tokenToSpend) || isZeroAddress(tokenToSpend)) {
				return true;
			}

			const result = await approveERC20({
				connector: provider,
				chainID: fromChainID,
				contractAddress: toAddress(tokenToSpend),
				spenderAddress: toAddress(spender),
				amount: toBigInt(amount),
				statusHandler
			});
			return result.isSuccessful;
		},
		[configuration.input.token, configuration.output.token, currentTxRequest, provider]
	);

	/**********************************************************************************************
	 ** performSolverSwap will perform the swap using the Portals API. It will get the transaction
	 ** data from the API and send the transaction. It will also wait for the transaction to be
	 ** mined and check if the transaction was successful.
	 ** Once this is done, it will refresh the balances of the input and output tokens.
	 *********************************************************************************************/
	const performSolverSwap = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus>>): Promise<boolean> => {
			if (!currentTxRequest || !configuration.input.token || !configuration.output.token) {
				return false;
			}
			statusHandler({...defaultTxStatus, pending: true});

			const fromChainID = currentTxRequest.action.fromChainId;
			const toChainID = currentTxRequest.action.toChainId;
			/**************************************************************************************
			 ** First, update the chainID to match the chainID of the input token. If the chainID
			 ** is not the same, switch the chain.
			 *************************************************************************************/
			const wagmiProvider = await toWagmiProvider(provider);
			if (wagmiProvider.chainId !== fromChainID) {
				try {
					await switchChain(retrieveConfig(), {chainId: fromChainID});
				} catch (error) {
					statusHandler({...defaultTxStatus, error: true, errorMessage: 'Failed to switch chain'});
					return false;
				}
			}

			/**************************************************************************************
			 ** Then send the transaction and wait for the receipt. If the transaction was
			 ** successful, update the status to success. Otherwise, update the status to error.
			 *************************************************************************************/
			const txParams = {
				chainId: currentTxRequest.transactionRequest.chainId,
				data: currentTxRequest.transactionRequest.data as Hex,
				to: toAddress(currentTxRequest.transactionRequest.to),
				value: toBigInt(currentTxRequest.transactionRequest.value ?? 0),
				gasPrice: toBigInt(currentTxRequest.transactionRequest.gasPrice ?? 0),
				gas: toBigInt(currentTxRequest.transactionRequest.gasLimit ?? 0),
				account: toAddress(currentTxRequest.transactionRequest.from)
			};

			try {
				const gas = await estimateGas(retrieveConfig(), txParams);
				console.log(gas);
			} catch (error) {
				console.warn(error);
				statusHandler({...defaultTxStatus, error: true});
				set_currentError(`The simulation failed with the following error: ${(error as any).details}`);
				return false;
			}

			try {
				const txHash = await sendTransaction(retrieveConfig(), txParams);
				const receipt = await waitForTransactionReceipt(retrieveConfig(), {
					chainId: currentTxRequest.transactionRequest.chainId,
					hash: txHash
				});
				if (receipt.status !== 'success') {
					statusHandler({...defaultTxStatus, error: true, errorMessage: 'Transaction failed'});
				}

				/**********************************************************************************
				 ** Then, if it's a cross-chain swap, check the status of the transaction on the
				 ** output chain. If the status is not DONE or FAILED, keep checking until it is.
				 ** This is done to ensure the transaction is mined on the output chain.
				 *********************************************************************************/
				if (fromChainID !== toChainID) {
					let result;
					do {
						result = await getLifiStatus({fromChainID, toChainID, txHash});
						await new Promise(resolve => setTimeout(resolve, 5000));
					} while (result.status !== 'DONE' && result.status !== 'FAILED');

					await onRefreshSolverBalances(configuration.input.token, configuration.output.token);
					if (result.status === 'DONE') {
						statusHandler({...defaultTxStatus, success: true});
					} else {
						statusHandler({...defaultTxStatus, error: true, errorMessage: 'Transaction failed'});
					}
					return result.status === 'DONE';
				}
				await onRefreshSolverBalances(configuration.input.token, configuration.output.token);
				statusHandler({...defaultTxStatus, success: true});
				return true;
			} catch (error) {
				console.warn(error);
				statusHandler({...defaultTxStatus, error: true});
				set_currentError(`The transaction failed with the following error: ${(error as any).details}`);
				return false;
			}
		},
		[configuration.input.token, configuration.output.token, currentTxRequest, onRefreshSolverBalances, provider]
	);

	/**********************************************************************************************
	 ** The context value is the value that will be provided to the children of the SwapContext.
	 ** It contains the configuration, the dispatch function, the current error, the fetching state,
	 ** the validity of the configuration, and the functions to check the allowance, retrieve the
	 ** expected output, approve the spender, and perform the swap.
	 *********************************************************************************************/
	const contextValue = useMemo(
		(): TSwapContext => ({
			configuration,
			dispatchConfiguration: dispatch,
			currentError,
			isFetchingQuote,
			isValid: Boolean(currentTxRequest !== undefined && address && !currentError),
			retrieveExpectedOut,
			hasSolverAllowance,
			approveSolverSpender,
			performSolverSwap
		}),
		[
			configuration,
			currentError,
			isFetchingQuote,
			currentTxRequest,
			address,
			retrieveExpectedOut,
			hasSolverAllowance,
			approveSolverSpender,
			performSolverSwap
		]
	);

	return (
		<SwapContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
		</SwapContext.Provider>
	);
};

export const useSwapFlow = (): TSwapContext => {
	const ctx = useContext(SwapContext);
	if (!ctx) {
		throw new Error('SwapContext not found');
	}
	return ctx;
};
