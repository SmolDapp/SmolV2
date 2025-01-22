import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TTxStatus} from '@lib/utils/tools.transactions';
import type {TTokenAmountInputElement} from 'packages/smol/common/SmolTokenAmountInput';
import type {Dispatch, SetStateAction} from 'react';

/**********************************************************************************************
 ** TSwapConfiguration contains all the necessary information to perform a swap operation.
 *********************************************************************************************/
export type TSwapConfiguration = {
	receiver: TInputAddressLike;
	input: TTokenAmountInputElement;
	output: TTokenAmountInputElement;
	slippageTolerance: number; //float number
	order: 'RECOMMENDED' | 'FASTEST' | 'CHEAPEST' | 'SAFEST';
};

/**********************************************************************************************
 ** TSwapActions is the list of possible actions that can be dispatched to the swap context.
 ** SET_RECEIVER: Set the receiver of the swap operation.
 ** SET_INPUT: Set the input token of the swap operation.
 ** SET_INPUT_VALUE: Set the value of the input token.
 ** SET_OUTPUT_VALUE: Set the value of the output token.
 ** SET_SLIPPAGE: Set the slippage tolerance of the swap operation.
 ** SET_ORDER: Set the order of the swap operation.
 ** INVERSE_TOKENS: Inverse the input and output tokens.
 ** RESET_INPUT: Reset the input token configuration.
 ** RESET_OUTPUT: Reset the output token configuration.
 ** RESET: Reset the swap configuration.
 *********************************************************************************************/
export type TSwapActions =
	| {type: 'SET_RECEIVER'; payload: Partial<TInputAddressLike>}
	| {type: 'SET_INPUT'; payload: TTokenAmountInputElement | undefined}
	| {type: 'SET_INPUT_VALUE'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_OUTPUT_VALUE'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_SLIPPAGE'; payload: number}
	| {type: 'SET_ORDER'; payload: TSwapConfiguration['order']}
	| {type: 'INVERSE_TOKENS'; payload: undefined}
	| {type: 'RESET_INPUT'; payload: undefined}
	| {type: 'RESET_OUTPUT'; payload: undefined}
	| {type: 'RESET'; payload: undefined};

/**********************************************************************************************
 ** TSwapContext is the context that will be used to perform a swap operation.
 ** configuration: The configuration of the swap operation.
 ** dispatchConfiguration: The dispatcher of the swap configuration.
 ** currentError: A string that contains the current error of the swap.
 ** estimatedTime: A number that contains the estimated time of the swap in seconds.
 ** isFetchingQuote: A boolean that indicates if the swap is fetching a quote.
 ** isValid: A boolean that indicates if the swap configuration is valid
 ** hasSolverAllowance: A function that checks if the user has enough allowance to perform the swap.
 ** retrieveExpectedOut: A function that retrieves the expected output of the swap.
 ** approveSolverSpender: A function that approves the spender for the token.
 ** performSolverSwap: A function that performs the swap.
 *********************************************************************************************/
export type TSwapContext = {
	configuration: TSwapConfiguration;
	dispatchConfiguration: Dispatch<TSwapActions>;
	currentError: string | undefined;
	estimatedTime: number | undefined;
	isFetchingQuote: boolean;
	isValid: boolean;
	hasSolverAllowance: () => Promise<boolean>;
	retrieveExpectedOut: (force?: boolean) => Promise<void>;
	approveSolverSpender: (statusHandler: Dispatch<SetStateAction<TTxStatus>>) => Promise<boolean>;
	performSolverSwap: (statusHandler: Dispatch<SetStateAction<TTxStatus>>) => Promise<boolean>;
	openSettingsCurtain: () => void;
};
