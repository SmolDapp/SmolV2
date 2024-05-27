import {parseUnits} from 'viem';

import type {TAllowance, TAllowances} from '@lib/types/Revoke';

export const filterNotEmptyEvents = (events: TAllowances): TAllowances => {
	return events.filter(item => (item.args.value as bigint) > BigInt(0));
};

/**************************************************************************************************
 ** This utility assists us in sorting approval events based on their blockNumber to obtain the
 ** most recent ones and filter out those with null values.
 *************************************************************************************************/
export const getLatestNotEmptyEvents = (approvalEvents: TAllowances): TAllowances => {
	const senderMap = approvalEvents.reduce((map: {[key: string]: TAllowance}, obj: TAllowance) => {
		if (obj.args.sender in map) {
			if (obj.blockNumber > map[obj.args.sender].blockNumber) {
				map[obj.args.sender] = obj;
			}
		} else {
			map[obj.args.sender] = obj;
		}
		return map;
	}, {});

	const resultArray: TAllowances = filterNotEmptyEvents(Object.values(senderMap));

	return resultArray;
};

/**************************************************************************************************
 ** Although labeled as "unlimited," allowances are not truly limitless. When set as unlimited,
 ** they are assigned the maximum value of uint256. However, as the contract utilizes tokens,
 ** the unlimited allowance diminishes. Hence, we must recognize an "unlimited" allowance as
 ** a very large yet variable quantity.
 *************************************************************************************************/
export const isUnlimitedBN = (value: bigint): boolean => {
	return (value as bigint) > parseUnits('115', 74);
};

/**************************************************************************************************
 ** The same as unlimited bigint we want to know if the number is large enough to be called
 ** unlimited.
 **************************************************************************************************/
export const isUnlimitedNumber = (value: number): boolean => {
	return value > Math.pow(10, 10);
};
