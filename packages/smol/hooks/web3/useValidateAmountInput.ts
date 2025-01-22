import {fromNormalized, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@lib/utils/numbers';
import {useCallback, useState} from 'react';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {TTokenAmountInputElement} from 'packages/smol/common/SmolTokenAmountInput';

/**************************************************************************************************
 ** TODO: Add comment
 *************************************************************************************************/
export function useValidateAmountInput(): {
	validate: (
		inputValue: string | undefined,
		token: TERC20TokensWithBalance | undefined,
		inputRaw?: TNormalizedBN
	) => Partial<TTokenAmountInputElement>;
	result: Partial<TTokenAmountInputElement> | undefined;
} {
	const [result, setResult] = useState<Partial<TTokenAmountInputElement> | undefined>(undefined);

	const validate = useCallback(
		(
			inputValue: string | undefined,
			token: TERC20TokensWithBalance | undefined,
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
				setResult(result);
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
					setResult(result);
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
					setResult(result);
					return result;
				}
				const result = {
					amount: inputRaw.display,
					normalizedBigAmount: inputRaw,
					isValid: true,
					token,
					error: undefined
				};
				setResult(result);
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
					setResult(result);
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
					setResult(result);
					return result;
				}
				const result = {
					amount: asNormalizedBN.display,
					normalizedBigAmount: asNormalizedBN,
					isValid: true,
					token,
					error: undefined
				};
				setResult(result);
				return result;
			}

			const result = {
				amount: '0',
				normalizedBigAmount: zeroNormalizedBN,
				isValid: false,
				token,
				error: 'The amount is invalid'
			};
			setResult(result);
			return result;
		},
		[]
	);

	return {validate, result};
}
