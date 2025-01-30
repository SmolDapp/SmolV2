/* eslint-disable no-case-declarations */
import {zeroNormalizedBN} from '@lib/utils/numbers';
import {defaultInputAddressLike} from '@lib/utils/tools.addresses';

import type {TTokenAmountInputElement} from '@lib/common/SmolTokenAmountInput';
import type {TSendActions, TSendConfiguration, TSendContext} from 'packages/smol/app/(apps)/send/types';

/**************************************************************************************************
 ** newSendVoidInput will return a new void input for the send configuration. It's used to
 ** initialize the object we need.
 *************************************************************************************************/
export function newSendVoidInput(): TTokenAmountInputElement {
	return {
		amount: '',
		normalizedBigAmount: zeroNormalizedBN,
		isValid: 'undetermined',
		token: undefined,
		status: 'none',
		UUID: crypto.randomUUID()
	};
}

/**************************************************************************************************
 ** useSendDefaultProps is the default context value for the SendContext.
 *************************************************************************************************/
export const useSendDefaultProps: TSendContext = {
	configuration: {
		receiver: defaultInputAddressLike,
		inputs: []
	},
	dispatchConfiguration: (): void => undefined
};

/**************************************************************************************************
 ** useSendConfigurationReducer is the reducer function for the send configuration. It will
 ** be used to update the send object. The actions are:
 ** SET_RECEIVER: Set the receiver of the send operation.
 ** ADD_INPUT: Add an input token to the send operation.
 ** ADD_INPUTS: Add multiple input tokens to the send operation.
 ** REMOVE_INPUT: Remove an input token from the send operation.
 ** REMOVE_SUCCESFUL_INPUTS: Remove all the successful inputs from the send operation.
 ** SET_VALUE: Set the value of the input token.
 ** RESET: Reset the send configuration.
 *************************************************************************************************/
export const useSendConfigurationReducer = (state: TSendConfiguration, action: TSendActions): TSendConfiguration => {
	switch (action.type) {
		case 'SET_RECEIVER':
			return {...state, receiver: {...state.receiver, ...action.payload}};
		case 'ADD_INPUT':
			return {
				...state,
				inputs: [...state.inputs, action.payload ? action.payload : newSendVoidInput()]
			};
		case 'ADD_INPUTS':
			const allInputs = [...state.inputs, ...(action.payload ? action.payload : [])];
			const validInputs = allInputs.filter(input => input.token !== undefined);
			return {
				...state,
				inputs: validInputs
			};
		case 'REMOVE_INPUT':
			return {
				...state,
				inputs: state.inputs.filter(input => input.UUID !== action.payload.UUID)
			};
		case 'REMOVE_SUCCESFUL_INPUTS':
			return {
				...state,
				inputs: state.inputs
					.filter(input => input.status !== 'success')
					.map(input => ({...input, status: 'none'}))
			};

		case 'SET_VALUE': {
			return {
				...state,
				inputs: state.inputs.map(input =>
					input.UUID === action.payload.UUID
						? {
								...input,
								...action.payload
							}
						: input
				)
			};
		}
		case 'RESET':
			return {receiver: defaultInputAddressLike, inputs: [newSendVoidInput()]};
	}
};
