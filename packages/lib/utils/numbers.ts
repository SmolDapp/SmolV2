import {formatUnits, parseUnits as vParseUnits} from 'viem';

/************************************************************************************************
 ** TNumberish represents various number-like types that can be used as input
 ** Includes:
 ** - bigint: For large integer values
 ** - number: For standard JavaScript numbers
 ** - string: For number representations as strings
 ** - Template literal type for type safety with string numbers
 ************************************************************************************************/
export type TNumberish = bigint | number | string | `${number}`; //wagmi weird type

/************************************************************************************************
 ** TNormalizedBN represents a normalized BigNumber with different representations
 ** Contains three forms of the same number:
 ** - raw: The original bigint value
 ** - normalized: The number converted to a JavaScript number with decimals
 ** - display: String representation formatted for display
 ************************************************************************************************/
export type TNormalizedBN = {raw: bigint; normalized: number; display: string};

/************************************************************************************************
 ** toBigInt converts any TNumberish value to a bigint
 **
 ** @param amount - Optional TNumberish value to convert
 ** @returns bigint - The converted value, or 0n if no amount provided
 **
 ** @example
 ** ```typescript
 ** const big = toBigInt('1000000000000000000'); // 1000000000000000000n
 ** const zero = toBigInt(); // 0n
 ** ```
 ************************************************************************************************/
export const toBigInt = (amount?: TNumberish): bigint => {
	return BigInt(amount || 0);
};

/************************************************************************************************
 ** toNormalizedValue converts a bigint to a normal number with decimal places
 **
 ** @param v - The bigint value to normalize
 ** @param d - Optional number of decimals (defaults to 18)
 ** @returns number - The normalized value as a JavaScript number
 **
 ** @example
 ** ```typescript
 ** const normalized = toNormalizedValue(1000000000000000000n); // 1.0
 ** ```
 ************************************************************************************************/
export const toNormalizedValue = (v: bigint, d?: number): number => {
	return Number(formatUnits(v, d ?? 18));
};

/************************************************************************************************
 ** toNormalizedBN creates a normalized BigNumber object with multiple representations
 **
 ** @param value - The value to normalize (can be any TNumberish type)
 ** @param decimals - The number of decimals to use for normalization
 ** @returns TNormalizedBN - Object containing raw, normalized, and display representations
 **
 ** @example
 ** ```typescript
 ** const norm = toNormalizedBN('1000000000000000000', 18);
 ** // {
 ** //   raw: 1000000000000000000n,
 ** //   normalized: 1.0,
 ** //   display: '1.0'
 ** // }
 ** ```
 ************************************************************************************************/
export function toNormalizedBN(value: TNumberish, decimals: number): TNormalizedBN {
	return {
		raw: toBigInt(value),
		normalized: Number(formatUnits(toBigInt(value), decimals ?? 18)),
		display: formatUnits(toBigInt(value), decimals ?? 18)
	};
}

/************************************************************************************************
 ** zeroNormalizedBN represents a zero value in normalized BigNumber format
 ** Useful as a default value or for initialization
 ************************************************************************************************/
export const zeroNormalizedBN: TNormalizedBN = toNormalizedBN(0, 18);

/************************************************************************************************
 ** fromNormalized converts a normalized number back to its raw bigint form
 **
 ** @param value - The normalized number to convert
 ** @param decimals - Optional number of decimals (defaults to 18)
 ** @returns bigint - The denormalized value as a bigint
 **
 ** @example
 ** ```typescript
 ** const raw = fromNormalized(1.0); // 1000000000000000000n
 ** ```
 ************************************************************************************************/
export function fromNormalized(value: number | string, decimals = 18): bigint {
	return vParseUnits(eToNumber(String(value)), decimals);
}

/************************************************************************************************
 ** parseUnits converts a number-like value to a bigint with the specified decimals
 **
 ** @param value - The value to parse (can be any TNumberish type)
 ** @param decimals - Optional number of decimals (defaults to 18)
 ** @returns bigint - The parsed value as a bigint
 **
 ** @example
 ** ```typescript
 ** const parsed = parseUnits(1.0); // 1000000000000000000n
 ** ```
 ************************************************************************************************/
export function parseUnits(value: TNumberish, decimals = 18): bigint {
	const valueAsNumber = Number(value);
	return vParseUnits(`${valueAsNumber}`, decimals);
}

/************************************************************************************************
 ** formatAmount formats a number for display with specific decimal and length constraints
 **
 ** @param amount - The number to format
 ** @param minimumFractionDigits - Minimum number of decimal places (default: 2)
 ** @param maximumFractionDigits - Maximum number of decimal places (default: 2)
 ** @param displayDigits - Maximum total digits to display, will add ellipsis if exceeded
 ** @param options - Additional formatting options (e.g., locales)
 ** @returns string - The formatted number string
 **
 ** @example
 ** ```typescript
 ** formatAmount(1234.5678, 2, 2, 5); // "1,234.57"
 ** formatAmount(1234.5678, 2, 2, 4); // "12...78"
 ** ```
 ************************************************************************************************/
export function formatAmount(
	amount: number | string,
	minimumFractionDigits = 2,
	maximumFractionDigits = 2,
	displayDigits = 0,
	options?: {
		locales?: string[];
	}
): string {
	let locale = 'en-US';
	if (typeof navigator !== 'undefined') {
		locale = navigator.language || 'fr-FR';
	}
	const locales = [];
	if (options?.locales) {
		locales.push(...options.locales);
	}
	locales.push('en-US');
	locales.push(locale);
	if (maximumFractionDigits < minimumFractionDigits) {
		maximumFractionDigits = minimumFractionDigits;
	}
	if (!amount) {
		amount = 0;
	}
	if (typeof amount === 'string') {
		amount = Number(amount);
	}
	if (isNaN(amount)) {
		amount = 0;
	}
	let formattedAmount = new Intl.NumberFormat(locales, {
		minimumFractionDigits,
		maximumFractionDigits
	}).format(amount);

	if (displayDigits > 0 && formattedAmount.length > displayDigits) {
		const leftSide = formattedAmount.slice(0, Math.ceil(displayDigits / 2));
		const rightSide = formattedAmount.slice(-Math.floor(displayDigits / 2));
		formattedAmount = `${leftSide}...${rightSide}`;
	}

	return formattedAmount;
}

/************************************************************************************************
 ** eToNumber converts scientific notation (e-notation) numbers to plain decimal strings
 **
 ** @param num - The number in scientific notation as a string
 ** @returns string - The number in plain decimal notation
 **
 ** @example
 ** ```typescript
 ** eToNumber('1.23e-18'); // '0.00000000000000000123'
 ** eToNumber('1.23e+18'); // '1230000000000000000'
 ** ```
 **
 ** Note: This function is particularly useful for handling very large or small numbers
 ** that JavaScript would normally represent in scientific notation
 ************************************************************************************************/
function eToNumber(num: string): string {
	let sign = '';
	(num += '').charAt(0) == '-' && ((num = num.substring(1)), (sign = '-'));
	const arr = num.split(/[e]/gi);
	if (arr.length < 2) {
		return sign + num;
	}
	const dot = '.';
	let n = arr[0];
	const exp = +arr[1];
	let w = (n = n.replace(/^0+/, '')).replace(dot, '');
	const pos = n.split(dot)[1] ? n.indexOf(dot) + exp : w.length + exp;
	const L = pos - w.length;
	const s = '' + BigInt(w);
	w = exp >= 0 ? (L >= 0 ? s + '0'.repeat(L) : r()) : pos <= 0 ? '0' + dot + '0'.repeat(Math.abs(pos)) + s : r();
	const V = w.split(dot);
	if ((Number(V[0]) == 0 && Number(V[1]) == 0) || (+w == 0 && +s == 0)) {
		w = '0';
	}
	return sign + w;
	function r(): string {
		return w.replace(new RegExp(`^(.{${pos}})(.)`), `$1${dot}$2`);
	}
}

/************************************************************************************************
 ** TAmountOptions defines configuration options for amount formatting
 ** Contains settings for:
 ** - minimumFractionDigits: Minimum number of decimal places to display
 ** - maximumFractionDigits: Maximum number of decimal places to display
 ** - displayDigits: Maximum total digits to show before truncating with ellipsis
 ** - shouldDisplaySymbol: Whether to show the currency/token symbol
 ** - shouldCompactValue: Whether to use compact notation for large numbers (e.g., 1K, 1M)
 ************************************************************************************************/
type TAmountOptions = {
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	displayDigits?: number;
	shouldDisplaySymbol?: boolean;
	shouldCompactValue?: boolean;
};

/************************************************************************************************
 ** TAmount represents a token or currency amount with its metadata
 ** Contains:
 ** - value: The actual amount as a bigint or number
 ** - decimals: Number of decimal places for the token/currency
 ** - symbol: Optional currency or token symbol (e.g., "USD", "ETH")
 ** - options: Optional formatting configuration
 ************************************************************************************************/
export type TAmount = {
	value: bigint | number;
	decimals: number | bigint;
	symbol?: string;
	options?: TAmountOptions;
};

/************************************************************************************************
 ** TFormatCurrencyWithPrecision defines parameters for precise currency formatting
 ** Used internally by formatLocalAmount to handle different precision cases
 ** Contains all necessary information for Intl.NumberFormat configuration
 ************************************************************************************************/
type TFormatCurrencyWithPrecision = {
	amount: number;
	maxFractionDigits: number;
	intlOptions: Intl.NumberFormatOptions;
	locale: string;
	symbol: string;
};

/************************************************************************************************
 ** defaultOptions provides default formatting options for amounts
 ** Sets reasonable defaults for fraction digits and display preferences
 ************************************************************************************************/
export const defaultOptions: TAmountOptions = {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	displayDigits: 0,
	shouldDisplaySymbol: true,
	shouldCompactValue: true
};

/************************************************************************************************
 ** assertValidNumber validates and normalizes numeric parameters
 **
 ** @param value - The number to validate
 ** @param defaultValue - Fallback value if validation fails
 ** @param label - Name of the parameter for error messages
 ** @returns number - The validated number or default value
 **
 ** Validates that the number is:
 ** - Not undefined (uses default)
 ** - Positive
 ** - Less than or equal to 18
 ** - Not NaN
 ** - A safe integer
 ************************************************************************************************/
function assertValidNumber(value: number | undefined, defaultValue: number, label: string): number {
	if (value === undefined) {
		return defaultValue;
	}
	if (value < 0) {
		console.warn(`formatAmount: ${label} should be positive.`);
		return defaultValue;
	}
	if (value > 18) {
		console.warn(`formatAmount: ${label} should be less than 18.`);
		return 18;
	}
	if (Number.isNaN(value)) {
		console.warn(`formatAmount: ${label} is NaN.`);
		return defaultValue;
	}
	if (!Number.isSafeInteger(value)) {
		console.warn(`formatAmount: ${label} should be an integer.`);
		return defaultValue;
	}
	return value;
}

/************************************************************************************************
 ** assignOptions processes and validates amount formatting options
 **
 ** @param options - Optional formatting options to process
 ** @returns TAmountOptions - Processed and validated options
 **
 ** Ensures:
 ** - All numeric values are valid
 ** - Maximum fraction digits is >= minimum fraction digits
 ** - Default values are set for undefined options
 ************************************************************************************************/
function assignOptions(options?: TAmountOptions): TAmountOptions {
	if (!options) {
		return defaultOptions;
	}

	options.displayDigits = assertValidNumber(options?.displayDigits, 0, 'displayDigits');
	options.minimumFractionDigits = assertValidNumber(options?.minimumFractionDigits, 2, 'minimumFractionDigits');
	options.maximumFractionDigits = assertValidNumber(options?.maximumFractionDigits, 2, 'maximumFractionDigits');

	if (options.maximumFractionDigits < options.minimumFractionDigits) {
		options.maximumFractionDigits = options.minimumFractionDigits;
	}

	options.shouldDisplaySymbol ??= true;
	options.shouldCompactValue ??= true;

	return options;
}

/************************************************************************************************
 ** formatCurrencyWithPrecision handles precise currency formatting with specific precision
 **
 ** @param props - Object containing formatting parameters
 ** @returns string - Formatted currency string
 **
 ** Handles:
 ** - Locale-specific formatting
 ** - Custom decimal precision
 ** - Symbol placement based on locale
 ************************************************************************************************/
function formatCurrencyWithPrecision({
	amount,
	maxFractionDigits,
	intlOptions,
	locale,
	symbol
}: TFormatCurrencyWithPrecision): string {
	return new Intl.NumberFormat([locale, 'en-US'], {
		...intlOptions,
		maximumFractionDigits: Math.max(maxFractionDigits, intlOptions.maximumFractionDigits || maxFractionDigits)
	})
		.format(amount)
		.replace('EUR', symbol);
}

/************************************************************************************************
 ** formatLocalAmount formats an amount with locale-specific settings
 **
 ** @param amount - The number to format
 ** @param decimals - Number of decimal places
 ** @param symbol - Currency or token symbol
 ** @param options - Formatting options
 ** @returns string - Formatted amount string
 **
 ** Features:
 ** - Handles different locales (defaults to en-US)
 ** - Supports compact notation for large numbers (>10k)
 ** - Special handling for percentages
 ** - Adjusts precision for very small numbers
 ** - Locale-appropriate symbol placement
 **
 ** @example
 ** ```typescript
 ** formatLocalAmount(1234.5678, 2, "USD", defaultOptions); // "$1,234.57"
 ** formatLocalAmount(1234567, 2, "ETH", {...defaultOptions, shouldCompactValue: true}); // "1.23M ETH"
 ** ```
 ************************************************************************************************/
export function formatLocalAmount(amount: number, decimals: number, symbol: string, options: TAmountOptions): string {
	let locale = 'en-US';
	if (typeof navigator !== 'undefined') {
		locale = navigator.language || 'fr-FR';
	}
	const locales = [];
	locales.push('en-US');
	locales.push(locale);

	const {shouldDisplaySymbol, shouldCompactValue, ...rest} = options;
	const intlOptions: Intl.NumberFormatOptions = rest;
	let isPercent = false;
	if (symbol && shouldDisplaySymbol) {
		const uppercaseSymbol = String(symbol).toLocaleUpperCase();
		const symbolToFormat = uppercaseSymbol === 'USD' ? 'USD' : 'EUR';
		(intlOptions.style = uppercaseSymbol === 'PERCENT' ? 'percent' : 'currency'),
			(intlOptions.currency = symbolToFormat),
			(intlOptions.currencyDisplay = symbolToFormat === 'EUR' ? 'code' : 'narrowSymbol');
		isPercent = uppercaseSymbol === 'PERCENT';
	}

	if (isPercent && amount > 5 && shouldCompactValue) {
		return `> ${new Intl.NumberFormat([locale, 'en-US'], intlOptions).format(5).replace('EUR', symbol)}`;
	}

	if (amount > 10_000 && shouldCompactValue) {
		return new Intl.NumberFormat([locale, 'en-US'], {
			...intlOptions,
			notation: 'compact',
			compactDisplay: 'short'
		})
			.format(amount)
			.replace('EUR', symbol);
	}

	if (amount < 0.01) {
		if (isPercent) {
			return formatCurrencyWithPrecision({amount, maxFractionDigits: 2, intlOptions, locale, symbol});
		}
		if (amount > 0.00000001) {
			return formatCurrencyWithPrecision({amount, maxFractionDigits: 8, intlOptions, locale, symbol});
		}
		if (amount > 0.000000000001) {
			return formatCurrencyWithPrecision({amount, maxFractionDigits: 12, intlOptions, locale, symbol});
		}
		return formatCurrencyWithPrecision({amount, maxFractionDigits: decimals, intlOptions, locale, symbol});
	}
	return new Intl.NumberFormat([locale, 'en-US'], intlOptions).format(amount).replace('EUR', symbol);
}

/************************************************************************************************
 ** formatTAmount formats a TAmount object into a localized string
 **
 ** @param props - TAmount object containing value, decimals, symbol, and options
 ** @returns string - Formatted amount string
 **
 ** Features:
 ** - Handles both bigint and number values
 ** - Validates and processes formatting options
 ** - Handles special cases (zero, infinity)
 ** - Applies locale-specific formatting
 **
 ** @example
 ** ```typescript
 ** formatTAmount({
 **   value: 1234567890n,
 **   decimals: 18,
 **   symbol: "ETH",
 **   options: { shouldCompactValue: true }
 ** }); // "1.23M ETH"
 ** ```
 ************************************************************************************************/
export function formatTAmount(props: TAmount): string {
	const {value} = props;
	const options = assignOptions(props.options);
	const decimals = assertValidNumber(Number(props.decimals), 18, 'decimals');
	let amount = 0;
	if (typeof value === 'bigint') {
		amount = toNormalizedValue(toBigInt(value), decimals);
	} else if (typeof value === 'number' && !Number.isNaN(value)) {
		amount = value;
	}

	if (amount === 0) {
		return formatLocalAmount(0, 0, props.symbol || '', options);
	}
	if (!Number.isFinite(amount)) {
		return '∞';
	}
	return formatLocalAmount(amount, decimals, props.symbol || '', options);
}

/************************************************************************************************
 ** formatCounterValue formats a counter value based on an amount and a price
 **
 ** @param amount - The amount to format (can be number or string)
 ** @param price - The price to multiply the amount by
 ** @returns string - The formatted counter value with dollar sign
 **
 ** Features:
 ** - Handles zero or undefined values gracefully
 ** - Formats large values (>10000) without decimals
 ** - Formats smaller values with 2 decimal places
 ** - Always includes dollar sign prefix
 **
 ** @example
 ** ```typescript
 ** formatCounterValue('1234.5678', 2); // "$2,469.14"
 ** formatCounterValue('5000', 3); // "$15,000"
 ** formatCounterValue(0, 100); // "$0.00"
 ** ```
 ************************************************************************************************/
export function formatCounterValue(amount: number | string, price: number): string {
	if (!amount || !price) {
		return `$${formatAmount(0, 2, 2)}`;
	}

	const value = (Number(amount) || 0) * (price || 0);
	if (value > 10000) {
		return `$${formatAmount(value, 0, 0)}`;
	}
	return `$${formatAmount(value, 2, 2)}`;
}

/************************************************************************************************
 ** parseAmount parses a localized number string into a JavaScript number
 **
 ** @param stringNumber - The number string to parse (can include thousand/decimal separators)
 ** @param providedLocales - Optional array of locales to use for parsing
 ** @returns number - The parsed number value
 **
 ** Features:
 ** - Handles different locale-specific number formats
 ** - Supports custom thousand and decimal separators
 ** - Falls back to browser locale if available
 ** - Defaults to en-US if no locale is available
 **
 ** @example
 ** ```typescript
 ** parseAmount('1,234.56'); // 1234.56
 ** parseAmount('1.234,56', ['de-DE']); // 1234.56
 ** parseAmount('1 234,56', ['fr-FR']); // 1234.56
 ** ```
 **
 ** Note: This function is particularly useful when parsing user input that may contain
 ** locale-specific number formatting
 ************************************************************************************************/
export function parseAmount(stringNumber: string, providedLocales?: string[]): number {
	let locale = 'en-US';
	if (typeof navigator !== 'undefined') {
		locale = navigator.language || 'fr-FR';
	}
	const locales = [];
	if (providedLocales) {
		locales.push(...providedLocales);
	}
	locales.push('en-US');
	locales.push(locale);

	const thousandSeparator = Intl.NumberFormat(locales)
		.format(11111)
		.replace(/\p{Number}/gu, '');
	const decimalSeparator = Intl.NumberFormat(locales)
		.format(1.1)
		.replace(/\p{Number}/gu, '');

	return parseFloat(
		stringNumber
			.replace(new RegExp('\\' + thousandSeparator, 'g'), '')
			.replace(new RegExp('\\' + decimalSeparator), '.')
	);
}

/************************************************************************************************
 ** percentOf calculates a percentage of a value with high precision
 **
 ** @param value - The base value to calculate percentage from
 ** @param percentage - The percentage to calculate (e.g., 50 for 50%)
 ** @param precision - Number of decimal places for precision (default: 12)
 ** @returns number - The calculated percentage value
 **
 ** Features:
 ** - Handles floating point precision errors using integer multiplication
 ** - Supports high precision calculations up to 12 decimal places
 ** - Includes fallback for very large numbers
 ** - Prevents overflow errors with large numbers
 **
 ** @example
 ** ```typescript
 ** percentOf(100, 50); // 50 (50% of 100)
 ** percentOf(33.333333, 75); // 24.999999750000 (75% of 33.333333)
 ** percentOf(1000000000, 0.1); // 1000000 (0.1% of 1000000000)
 ** ```
 **
 ** Note: Uses a multiplier technique to avoid JavaScript floating point precision issues
 ** Falls back to basic percentage calculation if the number becomes too large
 ************************************************************************************************/
export const percentOf = (value: number, percentage: number, precision = 12): number => {
	const multiplier = Math.pow(10, precision);
	const multipliedValue = value * multiplier;

	const multipliedResult = (multipliedValue / 100) * percentage;

	const result = multipliedResult / multiplier;

	// In case the multiplier causes the number to be too large for JS to handle, return a basic percent value as fallback
	if (Number.isNaN(result)) {
		return (value / 100) * percentage;
	}

	return result;
};
