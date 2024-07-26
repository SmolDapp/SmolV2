import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

export type TModify<TOriginal, TModification> = Omit<TOriginal, keyof TModification> & TModification;

export type TWriteable<T> = {-readonly [P in keyof T]: T[P]};

/**************************************************************************************************
 ** Acts like Partial, but requires all properties to be explicity set to undefined if missing.
 *************************************************************************************************/
export type TPartialExhaustive<T> = {[Key in keyof T]: T[Key] | undefined};

/**************************************************************************************************
 ** The TTokenAmountInputElement type definition is used in the SmolTokenAmountInput component
 ** and define the different properties that are used to represent a token amount input element.
 ** The properties are:
 ** - amount: string - Represents what the user inputed
 ** - value?: number - Represents the value of the input element
 ** - normalizedBigAmount: TNormalizedBN - Represents the normalized amount, used for calculations
 ** - token: TToken | undefined - Represents the token that the user selected
 ** - status: 'pending' | 'success' | 'error' | 'none' - Represents the status of the input element
 ** - isValid: boolean | 'undetermined' - Represents if the input is valid
 ** - error?: string | undefined - Represents the error message if the input is invalid
 ** - UUID: string - Represents the unique identifier of the input element
 *************************************************************************************************/
export type TTokenAmountInputElement = {
	amount: string;
	value?: number;
	normalizedBigAmount: TNormalizedBN;
	token: TToken | undefined;
	status: 'pending' | 'success' | 'error' | 'none';
	isValid: boolean | 'undetermined';
	error?: string | undefined;
	UUID: string;
};

export function isNonNullable<T>(value: T): value is NonNullable<T> {
	return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
	return typeof value === 'string';
}
