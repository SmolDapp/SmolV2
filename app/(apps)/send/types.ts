import type {TTokenAmountInputElement} from '@lib/components/SmolTokenAmountInput';
import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {Dispatch} from 'react';
/**********************************************************************************************
 ** TSendConfiguration contains all the necessary information to perform a send operation.
 *********************************************************************************************/
export type TSendConfiguration = {
	receiver: TInputAddressLike;
	inputs: TTokenAmountInputElement[];
};

/**********************************************************************************************
 ** TSendActions is the list of possible actions that can be dispatched to the send context.
 ** SET_RECEIVER: Set the receiver of the send operation.
 ** ADD_INPUT: Add an input token to the send operation.
 ** ADD_INPUTS: Add multiple input tokens to the send operation.
 ** REMOVE_INPUT: Remove an input token from the send operation.
 ** REMOVE_SUCCESFUL_INPUTS: Remove all the successful inputs from the send operation.
 ** SET_VALUE: Set the value of the input token.
 ** RESET: Reset the send configuration.
 *********************************************************************************************/
export type TSendActions =
	| {type: 'SET_RECEIVER'; payload: Partial<TInputAddressLike>}
	| {type: 'ADD_INPUT'; payload: TTokenAmountInputElement | undefined}
	| {type: 'ADD_INPUTS'; payload: TTokenAmountInputElement[] | undefined}
	| {type: 'REMOVE_INPUT'; payload: {UUID: string}}
	| {type: 'REMOVE_SUCCESFUL_INPUTS'; payload: undefined}
	| {type: 'SET_VALUE'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'RESET'; payload: undefined};

/**********************************************************************************************
 ** TSendContext is the context that will be used to perform a send operation.
 ** configuration: The configuration of the send operation.
 ** dispatchConfiguration: The dispatcher of the send configuration.
 *********************************************************************************************/
export type TSendContext = {
	configuration: TSendConfiguration;
	dispatchConfiguration: Dispatch<TSendActions>;
};

/**********************************************************************************************
 ** TSendQuery represents the possible values for the URL query arguments that might be
 ** decoded and used to populate the send configuration.
 *********************************************************************************************/
export type TSendQuery = {
	to: string | undefined;
	tokens: string[] | undefined;
	values: string[] | undefined;
};
