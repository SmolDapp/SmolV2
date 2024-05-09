/**
 *
 * @param {TAllowances} events - Array of Approval Events
 * @returns {TAllowances}
 */

import {formatUnits, parseUnits} from 'viem';

import type {TAllowance, TAllowances} from './types/revokeType';

/**
 *
 * @param {TAllowances} events
 * @returns {TAllowances}
 */

export const filterNotEmptyEvents = (events: TAllowances): TAllowances => {
	return events.filter(item => item.args.value !== BigInt(0));
};

/**
 *
 * @param {TAllowances} approvalEvents - All approve events
 * @returns {TAllowances}
 */

export const getLatestNotEmptyEvents = (approvalEvents: TAllowances): TAllowances => {
	const senderMap = approvalEvents.reduce((map: {[key: string]: TAllowance}, obj: TAllowance) => {
		// Check if the current object's address is already in the map
		if (obj.args.sender in map) {
			// If yes, compare the values and update if necessary
			if (obj.blockNumber > map[obj.args.sender].blockNumber) {
				map[obj.args.sender] = obj;
			}
		} else {
			// If not, add it to the map
			map[obj.args.sender] = obj;
		}
		return map;
	}, {});

	// Convert the map back to an array of objects and filter results with empty values
	const resultArray: TAllowances = filterNotEmptyEvents(Object.values(senderMap));

	return resultArray;
};

/**
 *
 * @param {number} decimals - Token decimals in ERC20
 * @param {bigint} amountInBigint - Amount of token in bigint
 * @returns {string}
 */

export const getTokenAmount = (decimals?: number, amountInBigint?: bigint): string => {
	return formatUnits(amountInBigint ?? BigInt(0), decimals || 0);
};

export const isUnlimited = (value: bigint): boolean => {
	return (value as bigint) > parseUnits('115', 74);
};
