import {useState} from 'react';
import {fromNormalized, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getNewInput} from '@lib/utils/helpers';

import type {TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/Inputs';

export const defaultTokenInputLike: TTokenAmountInputElement = getNewInput();

/**************************************************************************************************
 ** TODO: Add comment
 *************************************************************************************************/
export function useValidateAmountInput(): {
	validate: (inputValue: string | undefined, token: TToken | undefined) => Partial<TTokenAmountInputElement>;
	result: Partial<TTokenAmountInputElement> | undefined;
} {
	const [result, set_result] = useState<Partial<TTokenAmountInputElement> | undefined>(undefined);

	const validate = (inputValue: string | undefined, token: TToken | undefined): Partial<TTokenAmountInputElement> => {
		if (!inputValue) {
			const result = {
				amount: inputValue,
				normalizedBigAmount: zeroNormalizedBN,
				isValid: false,
				token,
				error: 'The amount is invalid'
			};
			set_result(result);
			return result;
		}

		if (+inputValue > 0) {
			const inputBigInt = inputValue ? fromNormalized(inputValue, token?.decimals || 18) : toBigInt(0);
			const asNormalizedBN = toNormalizedBN(inputBigInt, token?.decimals || 18);

			if (!token?.address) {
				const result = {
					amount: asNormalizedBN.display,
					normalizedBigAmount: asNormalizedBN,
					isValid: false,
					token,
					error: 'No token selected'
				};
				set_result(result);
				return result;
			}

			if (inputBigInt > token.balance.raw) {
				const result = {
					amount: asNormalizedBN.display,
					normalizedBigAmount: asNormalizedBN,
					isValid: false,
					token,
					error: 'Insufficient Balance'
				};
				set_result(result);
				return result;
			}
			const result = {
				amount: asNormalizedBN.display,
				normalizedBigAmount: asNormalizedBN,
				isValid: true,
				token,
				error: undefined
			};
			set_result(result);
			return result;
		}
		const result = {
			amount: '0',
			normalizedBigAmount: zeroNormalizedBN,
			isValid: false,
			token,
			error: 'The amount is invalid'
		};
		set_result(result);
		return result;
	};
	return {validate, result};
}
