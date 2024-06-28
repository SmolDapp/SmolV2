import type {Dispatch} from 'react';
import type {TAddress, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TAmountInputElement} from '@lib/common/SmolAmountInput';
import type {TInputAddressLike} from '../utils/tools.address';
import type {TModify, TPartialExhaustive, TTokenAmountInputElement} from './utils';

/**********************************************************************************************
 ** TDisperseInput contains the receiver and the value of the disperse operation. The UUID is
 ** used to identify the input and control it from outside. It acts as a unique reference.
 *********************************************************************************************/
export type TDisperseInput = {
	receiver: TInputAddressLike;
	value: TAmountInputElement;
	UUID: string;
};

/**********************************************************************************************
 ** TDisperseConfiguration contains all the necessary information to perform a disperse
 ** operation
 *********************************************************************************************/
export type TDisperseConfiguration = {
	tokenToSend: TToken | undefined;
	inputs: TDisperseInput[];
};

/**********************************************************************************************
 ** TDisperseActions is the list of possible actions that can be dispatched to the disperse
 ** context.
 ** SET_TOKEN_TO_SEND: Set the token to send in the disperse operation.
 ** SET_RECEIVERS: Set the receivers of the disperse operation. (Replace all)
 ** ADD_RECEIVERS: Add receivers to the disperse operation. (Append)
 ** DEL_RECEIVER_BY_UUID: Delete a receiver by UUID.
 ** SET_RECEIVER: Update ad receiver by UUID.
 ** SET_VALUE: Update the value of a receiver by UUID.
 ** CLEAR_RECEIVERS: Clear all receivers.
 ** RESET: Reset the swap configuration.
 *********************************************************************************************/
export type TDisperseActions =
	| {type: 'SET_TOKEN_TO_SEND'; payload: TToken | undefined}
	| {type: 'SET_RECEIVERS'; payload: TDisperseInput[]}
	| {type: 'ADD_RECEIVERS'; payload: TDisperseInput[]}
	| {type: 'DEL_RECEIVER_BY_UUID'; payload: string}
	| {type: 'SET_RECEIVER'; payload: Partial<TInputAddressLike> & {UUID: string}}
	| {type: 'SET_VALUE'; payload: Partial<TAmountInputElement> & {UUID: string}}
	| {type: 'CLEAR_RECEIVERS'; payload: undefined}
	| {type: 'RESET'; payload: undefined};

/**********************************************************************************************
 ** TDisperseContext is the context that will be used along with the disperse operation.
 ** configuration: The configuration of the disperse operation.
 ** dispatchConfiguration: The dispatcher of the disperse configuration.
 ** isDispersed: A boolean that indicates if the disperse operation was performed.
 ** onResetDisperse: A function that resets the disperse configuration.
 *********************************************************************************************/
export type TDisperseContext = {
	configuration: TDisperseConfiguration;
	dispatchConfiguration: Dispatch<TDisperseActions>;
	isDispersed: boolean;
	onResetDisperse: () => void;
};

/**********************************************************************************************
 ** TDisperseQuery contains the query parameters that are used to disperse tokens. It will
 ** be used to update the state based on the arguments passed in the URL.
 *********************************************************************************************/
export type TDisperseQuery = TPartialExhaustive<{
	token: string;
	addresses: string[];
	values: string[];
}>;

export type TInputWithToken = TModify<TTokenAmountInputElement, {token: TToken}>;

export type TDisperseTxInfo = {receiver: TAddress; amount: TNormalizedBN; token: TToken};
