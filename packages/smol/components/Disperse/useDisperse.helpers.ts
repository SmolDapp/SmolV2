/* eslint-disable no-case-declarations */
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultInputAddressLike} from '@lib/utils/tools.address';

import type {TDisperseActions, TDisperseConfiguration, TDisperseContext, TDisperseInput} from '@lib/types/app.disperse';

/**************************************************************************************************
 ** newDisperseVoidRow will return a new void row for the disperse configuration. It's used to
 ** initialize the object we need.
 *************************************************************************************************/
export function newDisperseVoidRow(): TDisperseInput {
	return {
		receiver: defaultInputAddressLike,
		value: {
			amount: '',
			normalizedBigAmount: zeroNormalizedBN,
			isValid: 'undetermined',
			status: 'none'
		},
		UUID: crypto.randomUUID()
	};
}

/**************************************************************************************************
 ** useDisperseDefaultProps is the default context value for the DisperseContext.
 *************************************************************************************************/
export const useDisperseDefaultProps: TDisperseContext = {
	isDispersed: false,
	dispatchConfiguration: (): void => undefined,
	onResetDisperse: (): void => undefined,
	configuration: {
		tokenToSend: undefined,
		inputs: []
	}
};

/**************************************************************************************************
 ** useDisperseConfigurationReducer is the reducer function for the disperse configuration. It will
 ** be used to update the configuration object. The actions are:
 ** - SET_TOKEN_TO_SEND: Set the token to send
 ** - SET_RECEIVERS: Set the receivers
 ** - ADD_RECEIVERS: Add receivers
 ** - PASTE_RECEIVERS: Paste receivers, replacing empty rows
 ** - CLEAR_RECEIVERS: Clear receivers
 ** - DEL_RECEIVER_BY_UUID: Delete a receiver by UUID
 ** - SET_RECEIVER: Set a receiver
 ** - SET_VALUE: Set a value
 ** - RESET: Reset the configuration
 *************************************************************************************************/
export const useDisperseConfigurationReducer = (
	state: TDisperseConfiguration,
	action: TDisperseActions
): TDisperseConfiguration => {
	switch (action.type) {
		case 'SET_TOKEN_TO_SEND':
			return {...state, tokenToSend: action.payload};
		case 'SET_RECEIVERS':
			return {...state, inputs: action.payload};
		case 'ADD_RECEIVERS':
			return {
				...state,
				inputs: [...state.inputs, ...action.payload]
			};
		case 'PASTE_RECEIVERS':
			const currentInputs = state.inputs;
			const noEmptyInputs = currentInputs.filter(input => !!input.receiver.address);
			return {
				...state,
				inputs: [...noEmptyInputs, ...action.payload]
			};
		case 'CLEAR_RECEIVERS':
			return {...state, inputs: []};

		case 'DEL_RECEIVER_BY_UUID':
			if (state.inputs.length === 1) {
				return {...state, inputs: [newDisperseVoidRow()]};
			}
			return {
				...state,
				inputs: state.inputs.filter((input): boolean => input.UUID !== action.payload)
			};

		case 'SET_RECEIVER': {
			return {
				...state,
				inputs: state.inputs.map(input =>
					input.UUID === action.payload.UUID
						? {
								...input,
								receiver: {
									...input.receiver,
									...action.payload
								}
							}
						: input
				)
			};
		}
		case 'SET_VALUE': {
			return {
				...state,
				inputs: state.inputs.map(input =>
					input.UUID === action.payload.UUID
						? {
								...input,
								value: {
									...input.value,
									...action.payload
								}
							}
						: input
				)
			};
		}
		case 'RESET':
			return {tokenToSend: undefined, inputs: [newDisperseVoidRow()]};
	}
};
