/* eslint-disable prefer-destructuring */

import {zeroAddress} from 'viem';

import {formatAmount} from '@lib/utils/numbers';

import type {TNormalizedBN} from '@lib/utils/numbers';

/************************************************************************************************
 ** Joins the given classes into a single string.
 ** @example cl('foo', 'bar') // 'foo bar'
 ** @example cl('foo', false && 'bar') // 'foo'
 **
 ** @param classes the classes to be joined
 ** @returns the joined classes
 ************************************************************************************************/
export function cl(...classes: (string | null | undefined)[]): string {
	return classes.filter(Boolean).join(' ');
}

/******************************************************************************
 ** Used to slugify a string.
 ** Src: https://gist.github.com/mathewbyrne/1280286
 *****************************************************************************/
export function slugify(text: string): string {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(/[^\w-]+/g, '') // Remove all non-word chars
		.replace(/--+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

export function handleLowAmount(normalizedBN: TNormalizedBN, min = 0, max = 6): string {
	const expected = formatAmount(normalizedBN.normalized, min, max);
	if (Number(expected) === 0) {
		return `< ${formatAmount(normalizedBN.normalized, max - 1, max - 1)}1`;
	}
	return expected;
}

/******************************************************************************
 ** Truncate a hash to a given size.
 *****************************************************************************/
export function truncateHexTx(hash: string | undefined, size: number): string {
	if (hash !== undefined) {
		if (size === 0) {
			return hash;
		}
		if (hash.length <= size * 2 + 4) {
			return hash;
		}
		return `0x${hash.slice(2, size + 2)}…${hash.slice(-size)}`;
	}
	if (size === 0) {
		return zeroAddress;
	}
	return `0x${zeroAddress.slice(2, size)}…${zeroAddress.slice(-size)}`;
}

/***************************************************************************
 ** Helper function to deep merge two objects
 **************************************************************************/
function isObject(input: unknown): input is Record<string, unknown> {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}

export function deepMerge(target: unknown, source: unknown): unknown {
	if (!isObject(target) || !isObject(source)) {
		return target;
	}

	Object.keys(target).forEach((key: string | number): void => {
		const targetValue = target[key];
		target[key] = targetValue;
	});

	Object.keys(source).forEach((key: string | number): void => {
		const targetValue = target[key];
		const sourceValue = source[key];

		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			target[key] = sourceValue; //no concat, replace
		} else if (isObject(targetValue) && isObject(sourceValue)) {
			target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
		} else {
			target[key] = sourceValue;
		}
	});

	return target;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export function acknowledge(..._args: unknown[]): void {
	// Do nothing. This function is used to acknowledge that the args are not used and disable some
	// linting errors.
	// Also should help fixing Warning: Cannot update a component while rendering a different component error.
}
