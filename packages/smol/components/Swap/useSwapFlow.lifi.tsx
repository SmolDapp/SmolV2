import React, {createContext, useCallback, useContext, useMemo, useReducer, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import {usePlausible} from 'next-plausible';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTriggerWithArgs} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	ZERO_ADDRESS,
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
import {estimateGas, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {optionalRenderProps, type TOptionalRenderProps} from '@lib/utils/react/optionalRenderProps';
import {defaultInputAddressLike} from '@lib/utils/tools.address';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {getLifiRoutes, getLifiStatus} from './api.lifi';
import {ProgressToasts} from './ProgressToast';
import {SwapCurtain} from './SettingsCurtain';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {Hex} from 'viem';
import type {TUseBalancesTokens} from '@builtbymom/web3/hooks/useBalances.multichains';
import type {TAddress, TChainTokens, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TSwapActions, TSwapConfiguration, TSwapContext} from '@lib/types/app.swap';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TLifiQuoteResponse, TLifiStatusResponse} from './api.lifi';

type TLastSolverFetchData = {
	inputToken: string;
	outputToken: string;
	inputAmount: string;
	receiver: TAddress;
	slippageTolerancePercentage: number;
	order: TSwapConfiguration['order'];
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
		slippageTolerance: 0.01,
		order: 'RECOMMENDED'
	},
	estimatedTime: undefined,
	isFetchingQuote: false,
	isValid: false,
	currentError: undefined,
	retrieveExpectedOut: async (): Promise<void> => undefined,
	dispatchConfiguration: (): void => undefined,
	hasSolverAllowance: async (): Promise<boolean> => false,
	approveSolverSpender: async (): Promise<boolean> => false,
	performSolverSwap: async (): Promise<boolean> => false,
	openSettingsCurtain: (): void => undefined
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
		case 'SET_ORDER':
			return {...state, order: action.payload};
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
	receiver: ZERO_ADDRESS,
	slippageTolerancePercentage: 0,
	order: 'SAFEST',
	time: 0
};
function assertLastSolverFetch(senderAddress: TAddress, configuration: TSwapConfiguration): boolean {
	if (!configuration.input.token || !configuration.output.token || !senderAddress) {
		return false;
	}

	const receiver = isZeroAddress(configuration.receiver.address)
		? toAddress(senderAddress)
		: toAddress(configuration.receiver.address);

	if (
		lastFetch &&
		toAddress(lastFetch.receiver) === receiver &&
		lastFetch.inputToken === configuration.input.token.address &&
		lastFetch.outputToken === configuration.output.token.address &&
		lastFetch.inputAmount === configuration.input.normalizedBigAmount.display &&
		lastFetch.slippageTolerancePercentage === configuration.slippageTolerance &&
		lastFetch.order === configuration.order &&
		Date.now() - lastFetch.time < 60000
	) {
		return false;
	}

	lastFetch = {
		receiver: receiver,
		inputToken: configuration.input.token.address,
		outputToken: configuration.output.token.address,
		inputAmount: configuration.input.normalizedBigAmount.display,
		slippageTolerancePercentage: configuration.slippageTolerance,
		order: configuration.order,
		time: Date.now()
	};
	return true;
}

const SwapContext = createContext<TSwapContext>(defaultProps);
export const SwapContextApp = (props: {children: TOptionalRenderProps<TSwapContext, ReactElement>}): ReactElement => {
	const plausible = usePlausible();
	const {address, provider, chainID} = useWeb3();
	const {onRefresh} = useWallet();
	const [configuration, dispatch] = useReducer(swapReducer, defaultProps.configuration);
	const [isFetchingQuote, set_isFetchingQuote] = useState<boolean>(false);
	const [currentTxRequest, set_currentTxRequest] = useState<TLifiQuoteResponse | undefined>(undefined);
	const [currentError, set_currentError] = useState<string | undefined>(undefined);
	const [shouldOpenCurtain, set_shouldOpenCurtain] = useState(false);
	const quoteAbortController = useRef<AbortController>(new AbortController());

	/**********************************************************************************************
	 ** The getPlausibleProps function will return the plausible properties for the current swap.
	 ** This is used to send events to Plausible in a consistent way.
	 *********************************************************************************************/
	const getPlausibleProps = useCallback(
		(args: {out: TNormalizedBN; estimate?: TLifiQuoteResponse['estimate']; txHash?: Hex}) => {
			return {
				inputChainID: configuration.input.token?.chainID,
				inputAmount: configuration.input.normalizedBigAmount.display,
				inputToken: configuration.input.token?.symbol,
				outputChainID: configuration.output.token?.chainID,
				outputToken: configuration.output.token?.symbol,
				outputAmount: args.out.display,
				slippage: configuration.slippageTolerance,
				order: configuration.order,
				isBridging: configuration.input.token?.chainID !== configuration.output.token?.chainID,
				estimate: args.estimate,
				txHash: args.txHash
			};
		},
		[
			configuration.input.normalizedBigAmount.display,
			configuration.input.token?.chainID,
			configuration.input.token?.symbol,
			configuration.order,
			configuration.output.token?.chainID,
			configuration.output.token?.symbol,
			configuration.slippageTolerance
		]
	);

	/**********************************************************************************************
	 ** The resetState function will reset the state of the context. It will set the fetching state
	 ** to false, the current transaction request to undefined, the current error to undefined, and
	 ** it will reset the configuration to its default values.
	 ** This is mainly used after a successful swap.
	 *********************************************************************************************/
	const resetState = useCallback((): void => {
		set_isFetchingQuote(false);
		set_currentTxRequest(undefined);
		set_currentError(undefined);
		dispatch({type: 'RESET', payload: undefined});
	}, []);

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
			const out = toNormalizedBN(toBigInt(result.estimate.toAmount), decimals);
			if (currentIdentifier !== expectedIdentifier) {
				return;
			}
			set_isFetchingQuote(false);
			set_currentTxRequest(result);
			set_currentError(undefined);
			plausible(PLAUSIBLE_EVENTS.SWAP_GET_QUOTE, {props: getPlausibleProps({out, estimate: result.estimate})});
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
		[configuration.input, configuration.output, getPlausibleProps, plausible]
	);
	const retrieveExpectedOut = useAsyncTriggerWithArgs(
		async (force = false): Promise<void> => {
			const hasValidInValue = configuration.input.normalizedBigAmount.raw > 0n;
			const hasValidIn = Boolean(configuration.input.token && !isZeroAddress(configuration.input.token.address));
			const hasValidOut = Boolean(
				configuration.output.token && !isZeroAddress(configuration.output.token.address)
			);

			if (hasValidIn && hasValidOut && hasValidInValue) {
				if (!assertLastSolverFetch(toAddress(address), configuration) && !force) {
					return;
				}
				if (quoteAbortController.current) {
					quoteAbortController.current.abort();
					if (quoteAbortController.current.signal.aborted) {
						quoteAbortController.current = new AbortController();
					}
				}

				const identifier = createUniqueID(serialize(configuration));
				currentIdentifier = identifier;

				set_currentError(undefined);
				set_isFetchingQuote(true);
				dispatch({
					type: 'SET_INPUT_VALUE',
					payload: {...configuration.input, value: undefined}
				});
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
					toAddress: isZeroAddress(configuration.receiver.address)
						? toAddress(address)
						: toAddress(configuration.receiver.address),
					fromAmount: toBigInt(configuration.input.normalizedBigAmount.raw).toString(),
					fromChainID: configuration.input.token?.chainID || -1,
					fromTokenAddress: toAddress(configuration.input.token?.address),
					toChainID: configuration.output.token?.chainID || -1,
					toTokenAddress: toAddress(configuration.output.token?.address),
					slippage: configuration.slippageTolerance,
					order: configuration.order,
					abortController: quoteAbortController.current
				});

				if (result) {
					handleQuoteResponse(result, identifier);
				}
				if (error) {
					/**********************************************************************************
					 ** If the error is 'canceled', this probably means that the user requested a new
					 ** quote before the previous one was finished. In this case, we should ignore the
					 ** error and the result as a new one will arrive soon.
					 *********************************************************************************/
					if (error === 'canceled') {
						if (identifier !== currentIdentifier) {
							return;
						}
					}
					set_currentError(error);
					set_isFetchingQuote(false);
				}
			}
		},
		[address, configuration, handleQuoteResponse]
	);

	/**********************************************************************************************
	 ** canProceedWithAllowanceFlow checks if the user can proceed with the allowance flow. It will
	 ** check if the current transaction request, input token, and output token are valid. It will
	 ** also check if the input amount is greater than 0 and if the input token is not an ETH token
	 ** or the zero address.
	 ** If all these conditions are met, it will return true meaning we can either retrieve the
	 ** allowance or proceed allowance request.
	 *********************************************************************************************/
	const canProceedWithAllowanceFlow = useMemo((): boolean => {
		if (!currentTxRequest || !configuration.input.token || !configuration.output.token) {
			return false;
		}

		if (toBigInt(currentTxRequest.action.fromAmount) === 0n) {
			return false;
		}

		const tokenToSpend = currentTxRequest.action.fromToken.address;
		if (isEthAddress(tokenToSpend) || isZeroAddress(tokenToSpend)) {
			return false;
		}
		return true;
	}, [configuration.input.token, configuration.output.token, currentTxRequest]);

	/**********************************************************************************************
	 ** hasSolverAllowance checks if the user has enough allowance to perform the swap. It will
	 ** check the allowance of the input token to the contract that will perform the swap, contract
	 ** which is provided by the Portals API.
	 *********************************************************************************************/
	const hasSolverAllowance = useCallback(async (): Promise<boolean> => {
		if (!currentTxRequest || !canProceedWithAllowanceFlow) {
			return isEthAddress(currentTxRequest?.action.fromToken.address);
		}

		const allowance = await allowanceOf({
			connector: provider,
			chainID: currentTxRequest.action.fromChainId,
			tokenAddress: toAddress(currentTxRequest.action.fromToken.address),
			spenderAddress: toAddress(currentTxRequest.estimate.approvalAddress)
		});

		return allowance >= toBigInt(currentTxRequest.action.fromAmount);
	}, [canProceedWithAllowanceFlow, currentTxRequest, provider]);

	/**********************************************************************************************
	 ** approveSolverSpender will approve the contract that will perform the swap to spend the
	 ** input token. It will use the Portals API to get the contract address and the amount to
	 ** approve.
	 *********************************************************************************************/
	const approveSolverSpender = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus>>): Promise<boolean> => {
			if (!currentTxRequest || !canProceedWithAllowanceFlow) {
				return false;
			}

			const result = await approveERC20({
				connector: provider,
				chainID: currentTxRequest.action.fromChainId,
				contractAddress: toAddress(currentTxRequest.action.fromToken.address),
				spenderAddress: toAddress(currentTxRequest.estimate.approvalAddress),
				amount: toBigInt(currentTxRequest.action.fromAmount),
				statusHandler,
				shouldDisplaySuccessToast: false
			});
			toast.success('Your tokens have been approved! You can now swap them!');
			return result.isSuccessful;
		},
		[canProceedWithAllowanceFlow, currentTxRequest, provider]
	);

	/**********************************************************************************************
	 ** performSolverSwap will perform the swap using the Portals API. It will get the transaction
	 ** data from the API and send the transaction. It will also wait for the transaction to be
	 ** mined and check if the transaction was successful.
	 ** Once this is done, it will refresh the balances of the input and output tokens.
	 *********************************************************************************************/
	const performSolverSwap = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus & {data?: TLifiStatusResponse}>>): Promise<boolean> => {
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

			/**********************************************************************************
			 ** Try to estimate the gas for this transaction. If the estimation fails, update
			 ** the status to error and return false.
			 *********************************************************************************/
			try {
				await estimateGas(retrieveConfig(), txParams);
			} catch (error) {
				console.warn(error);
				type TError = {details: string};
				statusHandler({...defaultTxStatus, error: true});
				set_currentError(`The transaction failed with the following error: ${(error as TError).details}`);
				return false;
			}

			/**************************************************************************************
			 ** Send the transaction. If the transaction fails, update the status to error and
			 ** return false.
			 *************************************************************************************/
			let txHash: Hex;
			try {
				txHash = await sendTransaction(retrieveConfig(), txParams);
				/**********************************************************************************
				 ** If the transaction was sent successfully, update the status to pending and
				 ** send the event.
				 *********************************************************************************/
				plausible(PLAUSIBLE_EVENTS.SWAP_EXECUTED, {
					props: getPlausibleProps({out: configuration.output.normalizedBigAmount, txHash})
				});
				const receipt = await waitForTransactionReceipt(retrieveConfig(), {
					chainId: currentTxRequest.transactionRequest.chainId,
					hash: txHash
				});
				if (receipt.status !== 'success') {
					statusHandler({...defaultTxStatus, error: true, errorMessage: 'Transaction failed'});
					return false;
				}
			} catch (error) {
				console.warn(error);
				type TError = {details: string};
				statusHandler({...defaultTxStatus, error: true});
				set_currentError(`The transaction failed with the following error: ${(error as TError).details}`);
				return false;
			}

			/**************************************************************************************
			 ** Then, if it's a cross-chain swap, check the status of the transaction on the output
			 ** chain. If the status is not DONE or FAILED, keep checking until it is.
			 ** This is done to ensure the transaction is mined on the output chain.
			 *************************************************************************************/
			try {
				const durationInSeconds = currentTxRequest?.estimate.executionDuration || 0;
				const durationInMs = durationInSeconds * 1000;
				const expectedEnd = new Date(Date.now() + durationInMs).toLocaleTimeString();
				const toastID = toast.custom(
					t => (
						<ProgressToasts
							t={t}
							sendingTokenSymbol={currentTxRequest.action.fromToken.symbol}
							receivingTokenSymbol={currentTxRequest.action.toToken.symbol}
							expectedEnd={expectedEnd}
							isCompleted={false}
							animationDuration={1000}
						/>
					),
					{position: 'bottom-right', duration: Infinity}
				);

				let result: TLifiStatusResponse;
				do {
					result = await getLifiStatus({fromChainID, toChainID, txHash});
					await new Promise(resolve => setTimeout(resolve, 5000));
					toast.custom(
						t => (
							<ProgressToasts
								t={t}
								sendingTokenSymbol={currentTxRequest.action.fromToken.symbol}
								receivingTokenSymbol={currentTxRequest.action.toToken.symbol}
								expectedEnd={expectedEnd}
								isCompleted={false}
								animationDuration={1000}
								message={result.substatusMessage}
							/>
						),
						{position: 'bottom-right', duration: Infinity, id: toastID}
					);
				} while (result.status !== 'DONE' && result.status !== 'FAILED');

				toast.dismiss(toastID);
				await onRefreshSolverBalances(configuration.input.token, configuration.output.token);
				if (result.status === 'DONE') {
					plausible(PLAUSIBLE_EVENTS.SWAP_CONFIRMED, {
						props: getPlausibleProps({out: configuration.output.normalizedBigAmount, txHash})
					});
					toast.custom(
						t => (
							<ProgressToasts
								t={t}
								sendingTokenSymbol={currentTxRequest.action.fromToken.symbol}
								receivingTokenSymbol={currentTxRequest.action.toToken.symbol}
								expectedEnd={expectedEnd}
								isCompleted={true}
								animationDuration={1000}
								message={'Fancy, your swap is complete!'}
							/>
						),
						{position: 'bottom-right', duration: 1000, id: toastID}
					);
					statusHandler({...defaultTxStatus, success: true, data: result});
					await new Promise(resolve => setTimeout(resolve, 1000));
					toast.custom(
						t => (
							<ProgressToasts
								t={t}
								sendingTokenSymbol={currentTxRequest.action.fromToken.symbol}
								receivingTokenSymbol={currentTxRequest.action.toToken.symbol}
								expectedEnd={expectedEnd}
								isCompleted={true}
								animationDuration={1000}
								message={'Fancy, your swap is complete!'}
							/>
						),
						{position: 'bottom-right', duration: 0, id: toastID}
					);
					toast.dismiss(toastID);
					toast.dismiss();
					resetState();
				} else {
					plausible(PLAUSIBLE_EVENTS.SWAP_REVERTED, {
						props: getPlausibleProps({out: configuration.output.normalizedBigAmount, txHash})
					});
					statusHandler({...defaultTxStatus, error: true, errorMessage: 'Transaction failed'});
				}
				toast.dismiss(toastID);
				toast.dismiss();
				return result.status === 'DONE';
			} catch (error) {
				console.warn(error);
				type TError = {details: string};
				statusHandler({...defaultTxStatus, error: true});
				set_currentError(`The transaction failed with the following error: ${(error as TError).details}`);
				toast.dismiss();
				return false;
			}
		},
		[
			configuration.input.token,
			configuration.output.normalizedBigAmount,
			configuration.output.token,
			currentTxRequest,
			getPlausibleProps,
			onRefreshSolverBalances,
			plausible,
			provider,
			resetState
		]
	);

	/**********************************************************************************************
	 ** onOpenSettingsCurtain will open the settings curtain. This is used to show the user the
	 ** settings of the swap.
	 *********************************************************************************************/
	const onOpenSettingsCurtain = useCallback((): void => {
		set_shouldOpenCurtain(true);
		plausible(PLAUSIBLE_EVENTS.OPEN_SWAP_SETTINGS_CURTAIN);
	}, [plausible]);

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
			estimatedTime: currentTxRequest?.estimate.executionDuration || undefined,
			retrieveExpectedOut,
			hasSolverAllowance,
			approveSolverSpender,
			performSolverSwap,
			openSettingsCurtain: onOpenSettingsCurtain
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
			performSolverSwap,
			onOpenSettingsCurtain
		]
	);

	return (
		<SwapContext.Provider value={contextValue}>
			{optionalRenderProps(props.children, contextValue)}
			<SwapCurtain
				isOpen={shouldOpenCurtain}
				onOpenChange={set_shouldOpenCurtain}
			/>
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
