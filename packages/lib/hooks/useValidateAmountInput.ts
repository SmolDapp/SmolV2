import {useCallback, useState} from 'react';
import {fromNormalized, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getNewInput} from '@lib/utils/helpers';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/Inputs';

export const defaultTokenInputLike: TTokenAmountInputElement = getNewInput();

/**************************************************************************************************
 ** TODO: Add comment
 *************************************************************************************************/
export function useValidateAmountInput(): {
	validate: (
		inputValue: string | undefined,
		token: TToken | undefined,
		inputRaw?: TNormalizedBN
	) => Partial<TTokenAmountInputElement>;
	result: Partial<TTokenAmountInputElement> | undefined;
} {
	const [result, set_result] = useState<Partial<TTokenAmountInputElement> | undefined>(undefined);

	const validate = useCallback(
		(
			inputValue: string | undefined,
			token: TToken | undefined,
			inputRaw?: TNormalizedBN
		): Partial<TTokenAmountInputElement> => {
			if (!inputValue && !inputRaw) {
				const result = {
					amount: inputValue,
					normalizedBigAmount: zeroNormalizedBN,
					isValid: true,
					token,
					error: 'The amount is invalid'
				};
				set_result(result);
				return result;
			}

			if (inputRaw && inputRaw.raw > 0n) {
				if (!token?.address) {
					const result = {
						amount: inputRaw.display,
						normalizedBigAmount: inputRaw,
						isValid: false,
						token,
						error: 'No token selected'
					};
					set_result(result);
					return result;
				}
				if (inputRaw.raw > token.balance.raw) {
					const result = {
						amount: inputRaw.display,
						normalizedBigAmount: inputRaw,
						isValid: false,
						token,
						error: 'Insufficient Balance'
					};
					set_result(result);
					return result;
				}
				const result = {
					amount: inputRaw.display,
					normalizedBigAmount: inputRaw,
					isValid: true,
					token,
					error: undefined
				};
				set_result(result);
				return result;
			}
			if (inputValue && +inputValue > 0) {
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
		},
		[]
	);

	return {validate, result};
}
