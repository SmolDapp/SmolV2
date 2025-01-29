import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TTokenAmountInputElement} from 'packages/smol/common/SmolTokenAmountInput';

/**********************************************************************************************
 ** The TSwapContext type defines the interface for the swap context used throughout the app.
 ** It includes:
 ** - Configuration properties (receiver, input/output tokens, slippage, order preference)
 ** - Status indicators (errors, estimated time, loading states, validity)
 ** - State management functions (setters, reset functions)
 ** - Core swap functionality (allowance checking, quote retrieval, approval, execution)
 ** - UI control (settings curtain)
 *********************************************************************************************/
export type TSwapContext = {
	receiver: TInputAddressLike;
	input: TTokenAmountInputElement;
	output: TTokenAmountInputElement;
	slippageTolerance: number; //float number
	order: 'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST';
	currentError: string | undefined;
	estimatedTime: number | undefined;
	isFetchingQuote: boolean;
	isValid: boolean;
	setReceiver: (receiver: TInputAddressLike) => void;
	setInput: (input: TTokenAmountInputElement | undefined) => void;
	setOutput: (output: TTokenAmountInputElement | undefined) => void;
	setSlippageTolerance: (slippage: number) => void;
	setOrder: (order: 'RECOMMENDED' | 'SAFEST' | 'FASTEST' | 'CHEAPEST') => void;
	inverseTokens: () => void;
	resetInput: () => void;
	resetOutput: () => void;
	reset: () => void;
	hasSolverAllowance: () => Promise<boolean>;
	retrieveExpectedOut: (force?: boolean) => Promise<void>;
	approveSolverSpender: (statusHandler: any) => Promise<boolean>;
	performSolverSwap: (statusHandler: any) => Promise<boolean>;
	openSettingsCurtain: () => void;
};
