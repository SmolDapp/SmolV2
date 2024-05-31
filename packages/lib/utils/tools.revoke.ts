import {parseUnits} from 'viem';

import type {TAllowance, TAllowances} from '@lib/types/Revoke';

export const filterDuplicateEvents = (events: TAllowances): TAllowances => {
	// const nonEmpty = events.filter(item => (item.args.value as bigint) > BigInt(0));
	const noDuplicate = events.filter(
		(item, index, self) =>
			self.findIndex(t => `${t.blockNumber}_${t.logIndex}` === `${item.blockNumber}_${item.logIndex}`) === index
	);
	return noDuplicate;
};

/**************************************************************************************************
 ** This utility assists us in sorting approval events based on their blockNumber to obtain the
 ** most recent ones and filter out those with null values. If block numbers are the same, we're
 ** supposed to compare them by logIndex.
 *************************************************************************************************/
export const getLatestNotEmptyEvents = (approvalEvents: TAllowances): TAllowances => {
	const filteredEvents = approvalEvents.reduce((acc: {[key: string]: TAllowance}, event: TAllowance) => {
		const key = `${event.address}-${event.args.sender}`;
		if (
			!acc[key] ||
			event.blockNumber > acc[key].blockNumber ||
			(event.blockNumber === acc[key].blockNumber && event.logIndex > acc[key].logIndex)
		) {
			acc[key] = event;
		}
		return acc;
	}, {});

	const resultArray: TAllowances = filterDuplicateEvents(Object.values(filteredEvents));

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
