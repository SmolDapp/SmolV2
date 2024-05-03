import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

/**************************************************************************************************
 ** The TTokenAmountInputElement type definition is used in the SmolTokenAmountInput component
 ** and define the different properties that are used to represent a token amount input element.
 ** The properties are:
 ** - amount: string - Represents what the user inputed
 ** - normalizedBigAmount: TNormalizedBN - Represents the normalized amount, used for calculations
 ** - token: TToken | undefined - Represents the token that the user selected
 ** - status: 'pending' | 'success' | 'error' | 'none' - Represents the status of the input element
 ** - isValid: boolean | 'undetermined' - Represents if the input is valid
 ** - error?: string | undefined - Represents the error message if the input is invalid
 ** - UUID: string - Represents the unique identifier of the input element
 *************************************************************************************************/
export type TTokenAmountInputElement = {
	amount: string;
	normalizedBigAmount: TNormalizedBN;
	token: TToken | undefined;
	status: 'pending' | 'success' | 'error' | 'none';
	isValid: boolean | 'undetermined';
	error?: string | undefined;
	UUID: string;
};
