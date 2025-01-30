'use client';

import {useWallet} from '@lib/contexts/useWallet';
import {useAsyncTriggerWithArgs} from '@lib/hooks/useAsyncTrigger';
import {
	estimateGas,
	getBalance,
	readContracts,
	sendTransaction,
	switchChain,
	waitForTransactionReceipt
} from '@wagmi/core';
import {useSearchParams} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {toast} from 'react-hot-toast';
import {erc20Abi, zeroAddress} from 'viem';
import {serialize, useAccount, useChainId, useConfig} from 'wagmi';

import {NoNaN, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@lib/utils/numbers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {
	defaultInputAddressLike,
	ethTokenAddress,
	isAddress,
	isEthAddress,
	isZeroAddress,
	toAddress
} from '@lib/utils/tools.addresses';
import {decodeAsBigInt, decodeAsNumber, decodeAsString} from '@lib/utils/tools.decoder';
import {allowanceOf, approveERC20} from '@lib/utils/tools.erc20';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {SwapCurtain} from 'packages/smol/app/(apps)/swap/components/SettingsCurtain';
import {SwapProgressToasts} from 'packages/smol/app/(apps)/swap/components/SwapProgressToasts';
import {getLifiRoutes, getLifiStatus} from 'packages/smol/app/(apps)/swap/utils/api.lifi';

import type {TTokenAmountInputElement} from '@lib/common/SmolTokenAmountInput';
import type {TUseBalancesTokens} from '@lib/contexts/useBalances.multichains';
import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TAddress, TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TChainERC20Tokens, TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {TTxStatus} from '@lib/utils/tools.transactions';
import type {TSwapContext} from 'packages/smol/app/(apps)/swap/types';
import type {TLifiQuoteResponse, TLifiStatusResponse} from 'packages/smol/app/(apps)/swap/utils/api.lifi';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {Toast} from 'react-hot-toast';
import type {Hex} from 'viem';

type TLastSolverFetchData = {
	inputToken: string;
	outputToken: string;
	inputAmount: string;
	receiver: TAddress;
	slippageTolerancePercentage: number;
	order: 'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST';
	time: number;
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
	receiver: zeroAddress,
	slippageTolerancePercentage: 0,
	order: 'SAFEST',
	time: 0
};

/**********************************************************************************************
 ** assertLastSolverFetch checks if a new quote should be fetched based on:
 ** 1. The validity of input parameters (tokens and sender address)
 ** 2. Changes in any swap parameters (tokens, amounts, receiver, slippage, order)
 ** 3. Time elapsed since last fetch (minimum 60 seconds between identical requests)
 ** Returns true if a new quote should be fetched, false otherwise.
 *********************************************************************************************/
function assertLastSolverFetch(
	senderAddress: TAddress,
	input: TTokenAmountInputElement,
	output: TTokenAmountInputElement,
	receiver: TInputAddressLike,
	slippageTolerance: number,
	order: 'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST'
): boolean {
	if (!input.token || !output.token || !senderAddress) {
		return false;
	}

	const receiverAddress = isZeroAddress(receiver.address) ? toAddress(senderAddress) : toAddress(receiver.address);

	if (
		lastFetch &&
		toAddress(lastFetch.receiver) === receiverAddress &&
		lastFetch.inputToken === input.token.address &&
		lastFetch.outputToken === output.token.address &&
		lastFetch.inputAmount === input.normalizedBigAmount.display &&
		lastFetch.slippageTolerancePercentage === slippageTolerance &&
		lastFetch.order === order &&
		Date.now() - lastFetch.time < 60000
	) {
		return false;
	}

	lastFetch = {
		receiver: receiverAddress,
		inputToken: input.token.address,
		outputToken: output.token.address,
		inputAmount: input.normalizedBigAmount.display,
		slippageTolerancePercentage: slippageTolerance,
		order: order,
		time: Date.now()
	};
	return true;
}

/**********************************************************************************************
 ** getNewInputToken creates a new empty token input state with default values.
 ** This is used when initializing or resetting token input/output fields.
 ** Returns a TTokenAmountInputElement with:
 ** - Empty amount and value
 ** - Zero normalized amount
 ** - Undetermined validity
 ** - No token selected
 ** - Default status
 ** - Unique UUID
 *********************************************************************************************/
function getNewInputToken(): TTokenAmountInputElement {
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
	receiver: defaultInputAddressLike,
	input: getNewInputToken(),
	output: getNewInputToken(),
	slippageTolerance: 0.01,
	order: 'RECOMMENDED',
	estimatedTime: undefined,
	isFetchingQuote: false,
	isValid: false,
	currentError: undefined,
	retrieveExpectedOut: async (): Promise<void> => undefined,
	setReceiver: () => undefined,
	setInput: () => undefined,
	setOutput: () => undefined,
	setSlippageTolerance: () => undefined,
	setOrder: () => undefined,
	inverseTokens: () => undefined,
	resetInput: () => undefined,
	resetOutput: () => undefined,
	reset: () => undefined,
	hasSolverAllowance: async (): Promise<boolean> => false,
	approveSolverSpender: async (): Promise<boolean> => false,
	performSolverSwap: async (): Promise<boolean> => false,
	openSettingsCurtain: (): void => undefined
};

const SwapContext = createContext<TSwapContext>(defaultProps);
/**********************************************************************************************
 ** SwapContextApp is the main provider component for the swap functionality.
 ** It manages:
 ** 1. Token selection and amounts for input/output
 ** 2. Swap settings (slippage, order preference)
 ** 3. Quote fetching and processing
 ** 4. Transaction execution and monitoring
 ** 5. Balance updates and UI state
 *********************************************************************************************/
export const SwapContextApp = (props: {children: ReactElement}): ReactElement => {
	const plausible = usePlausible();
	const config = useConfig();
	const chainID = useChainId();
	const {address, connector} = useAccount();
	const {onRefresh} = useWallet();
	const searchParams = useSearchParams();

	// State management
	const [receiver, setReceiver] = useState<TInputAddressLike>(defaultProps.receiver);
	const [input, setInput] = useState<TTokenAmountInputElement>(getNewInputToken());
	const [output, setOutput] = useState<TTokenAmountInputElement>(getNewInputToken());
	const [slippageTolerance, setSlippageTolerance] = useState<number>(defaultProps.slippageTolerance);
	const [order, setOrder] = useState<'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST'>('RECOMMENDED');
	const [isFetchingQuote, setIsFetchingQuote] = useState<boolean>(false);
	const [currentTxRequest, setCurrentTxRequest] = useState<TLifiQuoteResponse | undefined>(undefined);
	const [currentError, setCurrentError] = useState<string | undefined>(undefined);
	const [shouldOpenCurtain, setShouldOpenCurtain] = useState(false);
	const [isPopulatingInput, setIsPopulatingInput] = useState(false);
	const [hasPopulatedInput, setHasPopulatedInput] = useState(false);
	const [isPopulatingOutput, setIsPopulatingOutput] = useState(false);
	const [hasPopulatedOutput, setHasPopulatedOutput] = useState(false);
	const quoteAbortController = useRef<AbortController>(new AbortController());

	const populateInputArgs = useCallback(async () => {
		if (
			!searchParams?.has('tokenFrom') ||
			!searchParams?.has('chainFrom') ||
			hasPopulatedInput ||
			isPopulatingInput
		) {
			return;
		}
		setIsPopulatingInput(true);
		const tokenFrom = toAddress(searchParams.get('tokenFrom'));
		const chainFrom = NoNaN(Number(searchParams.get('chainFrom')));
		if (chainFrom > 0 && isAddress(tokenFrom)) {
			if (isEthAddress(tokenFrom)) {
				const balance = await getBalance(config, {address: toAddress(address), chainId: chainFrom});
				const network = config.chains.find(chain => chain.id === chainFrom);
				const nativeCoin = network?.nativeCurrency;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenFrom),
					chainID: chainFrom,
					symbol: nativeCoin?.symbol || '',
					decimals: nativeCoin?.decimals || 0,
					name: nativeCoin?.symbol || '',
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainFrom}/${tokenFrom}/logo-128.png`,
					value: 0,
					balance: toNormalizedBN(balance.value, nativeCoin?.decimals || 0)
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				setInput(newToken);
			} else {
				const from = {abi: erc20Abi, address: toAddress(tokenFrom), chainId: chainFrom};
				const calls = [
					{...from, functionName: 'symbol'},
					{...from, functionName: 'decimals'},
					{...from, functionName: 'balanceOf', args: [address]}
				];

				/******************************************************************************************
				 ** Once we have a valid result, we just need to update the configuration with the new
				 ** token information, mimicking the user input.
				 *****************************************************************************************/
				const result = await readContracts(config, {contracts: calls});
				const [symbol, decimals, balance] = result;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenFrom),
					chainID: chainFrom,
					symbol: decodeAsString(symbol),
					decimals: decodeAsNumber(decimals),
					name: decodeAsString(symbol),
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainFrom}/${tokenFrom}/logo-128.png`,
					value: 0,
					balance: toNormalizedBN(decodeAsBigInt(balance), decodeAsNumber(decimals))
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				setInput(newToken);
			}
		}
		setIsPopulatingInput(false);
		setHasPopulatedInput(true);
	}, [searchParams, hasPopulatedInput, isPopulatingInput, config, address]);

	const populateOutputArgs = useCallback(async () => {
		if (
			!searchParams?.has('tokenTo') ||
			!searchParams?.has('chainTo') ||
			hasPopulatedOutput ||
			isPopulatingOutput
		) {
			return;
		}
		setIsPopulatingOutput(true);
		const tokenTo = toAddress(searchParams.get('tokenTo'));
		const chainTo = NoNaN(Number(searchParams.get('chainTo')));
		if (chainTo > 0 && isAddress(tokenTo)) {
			if (isEthAddress(tokenTo)) {
				const network = config.chains.find(chain => chain.id === chainTo);
				const nativeCoin = network?.nativeCurrency;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenTo),
					chainID: chainTo,
					symbol: nativeCoin?.symbol || '',
					decimals: nativeCoin?.decimals || 0,
					name: nativeCoin?.symbol || '',
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainTo}/${tokenTo}/logo-128.png`,
					value: 0,
					balance: zeroNormalizedBN
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				setOutput(newToken);
			} else {
				const from = {abi: erc20Abi, address: toAddress(tokenTo), chainId: chainTo};
				const calls = [
					{...from, functionName: 'symbol'},
					{...from, functionName: 'decimals'}
				];

				/******************************************************************************************
				 ** Once we have a valid result, we just need to update the configuration with the new
				 ** token information, mimicking the user input.
				 *****************************************************************************************/
				const result = await readContracts(config, {contracts: calls});
				const [symbol, decimals] = result;
				const newToken = getNewInputToken();
				newToken.token = {
					address: toAddress(tokenTo),
					chainID: chainTo,
					symbol: decodeAsString(symbol),
					decimals: decodeAsNumber(decimals),
					name: decodeAsString(symbol),
					logoURI: `${process.env.SMOL_ASSETS_URL}/tokens/${chainTo}/${tokenTo}/logo-128.png`,
					value: 0,
					balance: zeroNormalizedBN
				};
				newToken.amount = newToken.token.balance.display;
				newToken.normalizedBigAmount = newToken.token.balance;
				setOutput(newToken);
			}
		}
		setIsPopulatingOutput(false);
		setHasPopulatedOutput(true);
	}, [searchParams, hasPopulatedOutput, isPopulatingOutput, config]);

	/**********************************************************************************************
	 ** setReceiverValue updates the receiver address while preserving other receiver properties
	 ** Used when changing the destination address for the swap
	 *********************************************************************************************/
	const setReceiverValue = useCallback((newReceiver: typeof defaultProps.receiver) => {
		setReceiver(prev => ({...prev, ...newReceiver}));
	}, []);

	/**********************************************************************************************
	 ** setInputValue handles updates to the input token and amount
	 ** It manages:
	 ** 1. Token selection changes
	 ** 2. Amount updates
	 ** 3. Balance synchronization
	 ** 4. Value calculations
	 *********************************************************************************************/
	const setInputValue = useCallback((newInput: Partial<TTokenAmountInputElement> | undefined) => {
		if (!newInput) {
			setInput(getNewInputToken());
			return;
		}

		setInput(prev => {
			if (prev.token?.address === newInput.token?.address) {
				return {...prev, ...newInput};
			}
			return {
				...prev,
				...newInput,
				amount: !newInput.amount ? newInput.token?.balance.display || '' : newInput.amount,
				normalizedBigAmount: !newInput.normalizedBigAmount
					? newInput.token?.balance || zeroNormalizedBN
					: newInput.normalizedBigAmount,
				value: newInput.value || undefined
			};
		});
	}, []);

	/**********************************************************************************************
	 ** setOutputValue handles updates to the output token and amount
	 ** Similar to setInputValue but for the output side of the swap
	 *********************************************************************************************/
	const setOutputValue = useCallback((newOutput: Partial<TTokenAmountInputElement> | undefined) => {
		if (!newOutput) {
			setOutput(getNewInputToken());
			return;
		}
		setOutput(prev => ({...prev, ...newOutput}));
	}, []);

	/**********************************************************************************************
	 ** getPlausibleProps prepares analytics data for tracking swap events
	 ** Includes:
	 ** - Chain IDs and token symbols
	 ** - Amounts and values
	 ** - Swap settings
	 ** - Cross-chain status
	 ** - Transaction details
	 *********************************************************************************************/
	const getPlausibleProps = useCallback(
		(args: {out: TNormalizedBN; estimate?: TLifiQuoteResponse['estimate']; txHash?: Hex}) => {
			return {
				inputChainID: input.token?.chainID,
				inputAmount: input.normalizedBigAmount.display,
				inputToken: input.token?.symbol,
				outputChainID: output.token?.chainID,
				outputToken: output.token?.symbol,
				outputAmount: args.out.display,
				slippage: slippageTolerance,
				order: order,
				isBridging: input.token?.chainID !== output.token?.chainID,
				estimate: args.estimate,
				txHash: args.txHash
			};
		},
		[
			input.normalizedBigAmount.display,
			input.token?.chainID,
			input.token?.symbol,
			order,
			output.token?.chainID,
			output.token?.symbol,
			slippageTolerance
		]
	);

	/**********************************************************************************************
	 ** handleQuoteResponse processes the quote from the API and updates the UI
	 ** It:
	 ** 1. Validates the quote matches the current request
	 ** 2. Updates loading and error states
	 ** 3. Calculates and sets output amounts
	 ** 4. Updates token values
	 ** 5. Tracks analytics
	 *********************************************************************************************/
	const handleQuoteResponse = useCallback(
		(result: TLifiQuoteResponse, expectedIdentifier: string): void => {
			const decimals = output.token?.decimals || 18;
			const out = toNormalizedBN(toBigInt(result.estimate.toAmount), decimals);
			if (currentIdentifier !== expectedIdentifier) {
				return;
			}
			setIsFetchingQuote(false);
			setCurrentTxRequest(result);
			setCurrentError(undefined);
			plausible(PLAUSIBLE_EVENTS.SWAP_GET_QUOTE, {props: getPlausibleProps({out, estimate: result.estimate})});

			setOutputValue({
				...output,
				amount: out.display,
				value: Number(result.estimate.toAmountUSD),
				normalizedBigAmount: out,
				isValid: true,
				error: undefined
			});

			setInputValue({
				...input,
				value: Number(result.estimate.fromAmountUSD)
			});
		},
		[input, output, getPlausibleProps, plausible, setInputValue, setOutputValue]
	);

	/**********************************************************************************************
	 ** inverseTokens swaps the input and output tokens
	 ** Maintains token balances and amounts during the swap
	 *********************************************************************************************/
	const inverseTokens = useCallback(() => {
		const newInput = {
			...output,
			amount: output.token?.balance.display || '',
			normalizedBigAmount: output.token?.balance || zeroNormalizedBN
		};
		const newOutput = {
			...input,
			amount: input.token?.balance.display || '',
			normalizedBigAmount: input.token?.balance || zeroNormalizedBN
		};
		setInput(newInput);
		setOutput(newOutput);
	}, [input, output]);

	/**********************************************************************************************
	 ** resetInput clears the input token selection and related output values
	 *********************************************************************************************/
	const resetInput = useCallback(() => {
		setInput(getNewInputToken());
		setOutput(prev => ({
			...prev,
			amount: '',
			value: undefined,
			normalizedBigAmount: zeroNormalizedBN
		}));
	}, []);

	/**********************************************************************************************
	 ** resetOutput clears only the output token selection
	 *********************************************************************************************/
	const resetOutput = useCallback(() => {
		setOutput(getNewInputToken());
	}, []);

	/**********************************************************************************************
	 ** resetState resets the entire swap interface to its initial state
	 ** Clears:
	 ** 1. Token selections and amounts
	 ** 2. Quote data and errors
	 ** 3. Settings to defaults
	 *********************************************************************************************/
	const resetState = useCallback(() => {
		setIsFetchingQuote(false);
		setCurrentTxRequest(undefined);
		setCurrentError(undefined);
		setReceiver(defaultProps.receiver);
		setInput(getNewInputToken());
		setOutput(getNewInputToken());
		setSlippageTolerance(defaultProps.slippageTolerance);
		setOrder(defaultProps.order);
	}, []);

	/**********************************************************************************************
	 ** retrieveExpectedOut fetches a quote from the API when swap parameters change
	 ** Manages:
	 ** 1. Input validation
	 ** 2. Request throttling
	 ** 3. Quote fetching
	 ** 4. Error handling
	 ** 5. State updates
	 *********************************************************************************************/
	const retrieveExpectedOut = useAsyncTriggerWithArgs(
		async (force = false): Promise<void> => {
			const hasValidInValue = input.normalizedBigAmount.raw > 0n;
			const hasValidIn = Boolean(input.token && !isZeroAddress(input.token.address));
			const hasValidOut = Boolean(output.token && !isZeroAddress(output.token.address));

			if (hasValidIn && hasValidOut && hasValidInValue) {
				if (
					!assertLastSolverFetch(toAddress(address), input, output, receiver, slippageTolerance, order) &&
					!force
				) {
					return;
				}
				if (quoteAbortController.current) {
					quoteAbortController.current.abort();
					if (quoteAbortController.current.signal.aborted) {
						quoteAbortController.current = new AbortController();
					}
				}

				const serialized = serialize({input, output, receiver, slippageTolerance, order});
				const identifier = createUniqueID(serialized);
				currentIdentifier = identifier;

				setCurrentError(undefined);
				setIsFetchingQuote(true);
				setOutputValue({
					...output,
					amount: undefined,
					value: 0,
					normalizedBigAmount: zeroNormalizedBN,
					isValid: false,
					error: undefined
				});
				setInputValue({
					...input,
					value: undefined
				});

				setCurrentTxRequest(undefined);
				const {result, error} = await getLifiRoutes({
					fromAddress: toAddress(address),
					toAddress: isZeroAddress(receiver.address) ? toAddress(address) : toAddress(receiver.address),
					fromAmount: toBigInt(input.normalizedBigAmount.raw).toString(),
					fromChainID: input.token?.chainID || -1,
					fromTokenAddress: toAddress(input.token?.address),
					toChainID: output.token?.chainID || -1,
					toTokenAddress: toAddress(output.token?.address),
					slippage: slippageTolerance,
					order: order,
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
					setCurrentError(error);
					setIsFetchingQuote(false);
				}
			}
		},
		[address, handleQuoteResponse, setInputValue, setOutputValue]
	);

	/**********************************************************************************************
	 ** onOpenSettingsCurtain handles the display of swap settings
	 ** Tracks the event in analytics
	 *********************************************************************************************/
	const onOpenSettingsCurtain = useCallback((): void => {
		setShouldOpenCurtain(true);
		plausible(PLAUSIBLE_EVENTS.OPEN_SWAP_SETTINGS_CURTAIN);
	}, [plausible]);

	/**********************************************************************************************
	 ** onRefreshSolverBalances updates token balances after a successful swap
	 ** Refreshes:
	 ** 1. Native token balance
	 ** 2. Input token balance
	 ** 3. Output token balance
	 *********************************************************************************************/
	const onRefreshSolverBalances = useCallback(
		async (
			inputToken: TERC20TokensWithBalance,
			outputToken: TERC20TokensWithBalance
		): Promise<TChainERC20Tokens> => {
			const inputTokenChainID = inputToken.chainID;
			const network = config.chains.find(chain => chain.id === inputTokenChainID);
			const chainCoin = network?.nativeCurrency;
			const tokensToRefresh: TUseBalancesTokens[] = [
				{
					address: ethTokenAddress,
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
		[config, onRefresh, chainID]
	);

	/**********************************************************************************************
	 ** canProceedWithAllowanceFlow checks if token approval is needed
	 ** Validates:
	 ** 1. Transaction request existence
	 ** 2. Token validity
	 ** 3. Amount > 0
	 ** 4. Token type (excludes ETH and zero address)
	 *********************************************************************************************/
	const canProceedWithAllowanceFlow = useMemo((): boolean => {
		if (!currentTxRequest || !input.token || !output.token) {
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
	}, [input.token, output.token, currentTxRequest]);

	/**********************************************************************************************
	 ** hasSolverAllowance checks if the spender has sufficient allowance
	 ** For:
	 ** 1. ERC20 tokens: Checks allowance against required amount
	 ** 2. ETH: Returns true (no approval needed)
	 ** 3. Invalid states: Returns false
	 *********************************************************************************************/
	const hasSolverAllowance = useCallback(async (): Promise<boolean> => {
		if (!currentTxRequest || !canProceedWithAllowanceFlow) {
			return isEthAddress(currentTxRequest?.action.fromToken.address);
		}

		const allowance = await allowanceOf({
			config: config,
			chainID: currentTxRequest.action.fromChainId,
			ownerAddress: toAddress(address),
			tokenAddress: toAddress(currentTxRequest.action.fromToken.address),
			spenderAddress: toAddress(currentTxRequest.estimate.approvalAddress)
		});

		return allowance >= toBigInt(currentTxRequest.action.fromAmount);
	}, [canProceedWithAllowanceFlow, currentTxRequest, config, address]);

	/**********************************************************************************************
	 ** approveSolverSpender handles the token approval transaction
	 ** Manages:
	 ** 1. Validation checks
	 ** 2. Approval transaction
	 ** 3. Success notification
	 ** 4. Status updates
	 *********************************************************************************************/
	const approveSolverSpender = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus>>): Promise<boolean> => {
			if (!currentTxRequest || !canProceedWithAllowanceFlow) {
				return false;
			}

			const result = await approveERC20({
				config: config,
				connector: connector,
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
		[canProceedWithAllowanceFlow, currentTxRequest, connector, config]
	);

	/**********************************************************************************************
	 ** performSolverSwap executes the swap transaction
	 ** Handles:
	 ** 1. Chain switching if needed
	 ** 2. Transaction sending and monitoring
	 ** 3. Cross-chain swap status tracking
	 ** 4. Balance updates
	 ** 5. Success/error notifications
	 ** 6. Analytics tracking
	 *********************************************************************************************/
	const performSolverSwap = useCallback(
		async (statusHandler: Dispatch<SetStateAction<TTxStatus & {data?: TLifiStatusResponse}>>): Promise<boolean> => {
			if (!currentTxRequest || !input.token || !output.token) {
				return false;
			}
			statusHandler({...defaultTxStatus, pending: true});

			const fromChainID = currentTxRequest.action.fromChainId;
			const toChainID = currentTxRequest.action.toChainId;
			/**************************************************************************************
			 ** First, update the chainID to match the chainID of the input token. If the chainID
			 ** is not the same, switch the chain.
			 *************************************************************************************/
			const chainId = await connector?.getChainId();
			if (chainId !== fromChainID) {
				try {
					await switchChain(config, {chainId: fromChainID});
				} catch (error) {
					console.error(error);
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
				await estimateGas(config, txParams);
			} catch (error) {
				console.warn(error);
				type TError = {details: string};
				statusHandler({...defaultTxStatus, error: true});
				setCurrentError(`The transaction failed with the following error: ${(error as TError).details}`);
				return false;
			}

			/**************************************************************************************
			 ** Send the transaction. If the transaction fails, update the status to error and
			 ** return false.
			 *************************************************************************************/
			let txHash: Hex;
			try {
				txHash = await sendTransaction(config, txParams);
				/**********************************************************************************
				 ** If the transaction was sent successfully, update the status to pending and
				 ** send the event.
				 *********************************************************************************/
				plausible(PLAUSIBLE_EVENTS.SWAP_EXECUTED, {
					props: getPlausibleProps({out: output.normalizedBigAmount, txHash})
				});
				const receipt = await waitForTransactionReceipt(config, {
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
				setCurrentError(`The transaction failed with the following error: ${(error as TError).details}`);
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
					(t: Toast) => (
						<SwapProgressToasts
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
						(t: Toast) => (
							<SwapProgressToasts
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
				await onRefreshSolverBalances(input.token, output.token);
				if (result.status === 'DONE') {
					plausible(PLAUSIBLE_EVENTS.SWAP_CONFIRMED, {
						props: getPlausibleProps({out: output.normalizedBigAmount, txHash})
					});
					toast.custom(
						(t: Toast) => (
							<SwapProgressToasts
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
						(t: Toast) => (
							<SwapProgressToasts
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
						props: getPlausibleProps({out: output.normalizedBigAmount, txHash})
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
				setCurrentError(`The transaction failed with the following error: ${(error as TError).details}`);
				toast.dismiss();
				return false;
			}
		},
		[
			input.token,
			output.normalizedBigAmount,
			output.token,
			currentTxRequest,
			getPlausibleProps,
			onRefreshSolverBalances,
			plausible,
			connector,
			resetState,
			config
		]
	);

	useEffect(() => {
		const populate = async (): Promise<void> => {
			await populateInputArgs();
			await populateOutputArgs();
		};
		if (address) {
			populate();
		}
	}, [populateInputArgs, populateOutputArgs, address]);

	const contextValue = useMemo(
		(): TSwapContext => ({
			input,
			output,
			receiver,
			slippageTolerance,
			order,
			setReceiver: setReceiverValue,
			setInput: setInputValue,
			setOutput: setOutputValue,
			setSlippageTolerance,
			setOrder,
			inverseTokens,
			resetInput,
			resetOutput,
			reset: resetState,
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
			input,
			output,
			receiver,
			slippageTolerance,
			order,
			setReceiverValue,
			setInputValue,
			setOutputValue,
			setSlippageTolerance,
			setOrder,
			inverseTokens,
			resetInput,
			resetOutput,
			resetState,
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
			{props.children}
			<SwapCurtain
				isOpen={shouldOpenCurtain}
				onOpenChange={setShouldOpenCurtain}
			/>
		</SwapContext.Provider>
	);
};

/**********************************************************************************************
 ** useSwapFlow is a custom hook that provides access to the swap context
 ** Throws an error if used outside of SwapContext.Provider
 *********************************************************************************************/
export const useSwapFlow = (): TSwapContext => {
	const ctx = useContext(SwapContext);
	if (!ctx) {
		throw new Error('SwapContext not found');
	}
	return ctx;
};
