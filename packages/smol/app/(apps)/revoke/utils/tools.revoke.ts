import {readContracts} from '@wagmi/core';
import axios from 'axios';
import {erc20Abi as abi} from 'viem';

import {toNormalizedValue} from '@lib/utils/numbers';
import {toAddress} from '@lib/utils/tools.addresses';
import {contractDataURL} from 'packages/smol/app/(apps)/revoke/constants';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {Config} from '@wagmi/core';
import type {TAllowance, TAllowances, TExpandedAllowance} from 'packages/smol/app/(apps)/revoke/types';

export const filterDuplicateEvents = (events: TAllowances): TAllowances => {
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
	const filteredEvents = approvalEvents.reduce((acc: Record<string, TAllowance>, event: TAllowance) => {
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
export const isUnlimitedBN = (value: bigint, decimals: number): boolean => {
	return toNormalizedValue(value as bigint, decimals) > Math.pow(10, 9);
};

/**********************************************************************************************
 ** Here, we obtain distinctive tokens based on their token addresses to avoid making
 ** additional requests for the same tokens.
 *********************************************************************************************/
export function getUniqueAllowancesByToken(allowances: TAllowances | undefined): TAllowances {
	const noDuplicatedStep0 = [...new Map(allowances?.map(item => [item.address, item])).values()];
	const noDuplicated = noDuplicatedStep0.filter(
		(item, index, self) =>
			index === self.findIndex(t => t.blockNumber === item.blockNumber && t.logIndex === item.logIndex)
	);
	return noDuplicated;
}

/**********************************************************************************************
 ** Here, we obtain distinctive allowances based on their spender addresses to avoid making
 ** additional requests for the same spender.
 *********************************************************************************************/
export function getUniqueAllowancesBySpender(allowances: TAllowances | undefined): TAllowances {
	return [...new Map(allowances?.map(item => [item.args.sender, item])).values()];
}

export function getUniqueExpandedAllowancesBySpender(
	allowances: TExpandedAllowance[] | undefined
): TExpandedAllowance[] {
	return [...new Map(allowances?.map(item => [item.spenderName, item])).values()];
}

export const getUniqueExpandedAllowancesByToken = (allowances: TExpandedAllowance[]): TExpandedAllowance[] => {
	return [
		...new Map(
			allowances?.map(item => [
				item.address,
				{
					...item
				}
			])
		).values()
	];
};

/**************************************************************************************************
 ** To get total amount at risk we should summarize all values*prices and make sure that summ
 ** isn't bigger that balance of the token.
 *************************************************************************************************/
export const getTotalAmountAtRisk = (
	allowances: TExpandedAllowance[],
	prices?: Record<TAddress, TNormalizedBN>
): number => {
	if (!prices) {
		return 0;
	}
	const uniqueAllowancesByToken = getUniqueExpandedAllowancesByToken(allowances);

	let sum = 0;
	/**********************************************************************************************
	 ** Then for each individual token we sum up all amounts in usd and if this amount is greater
	 ** than the balance, we use balance instead. After that we sum up all the token amounts
	 ** together.
	 *********************************************************************************************/
	for (const allowance of uniqueAllowancesByToken) {
		const arr = allowances.filter(item => item.address === allowance.address);
		const total = arr.reduce((sum, curr) => {
			const amountInUSD =
				toNormalizedValue(curr.args.value as bigint, curr.decimals) > curr.balanceOf.normalized
					? curr.balanceOf.normalized * prices[toAddress(curr.address)]?.normalized
					: toNormalizedValue(curr.args.value as bigint, curr.decimals) *
						prices[toAddress(curr.address)]?.normalized;
			return sum + amountInUSD;
		}, 0);
		if (total >= allowance.balanceOf.normalized) {
			sum = sum + allowance.balanceOf.normalized * prices[toAddress(allowance.address)]?.normalized;
		} else {
			sum = sum + total;
		}
	}
	return sum;
};

export async function getNameDictionaries(
	uniqueAllowancesBySpender: TAllowances,
	uniqueAllowancesByToken: TAllowances,
	address: TAddress,
	config: Config,
	setIsLoadingInitialDB: (value: boolean) => void
): Promise<
	| {
			tokenInfoDictionary: Record<TAddress, {symbol: string; decimals: number; balanceOf: bigint; name: string}>;
			spenderDictionary: Record<TAddress, {name: string}>;
	  }
	| undefined
> {
	const calls = [];
	for (const token of uniqueAllowancesByToken) {
		const from = {abi, address: toAddress(token.address), chainId: token.chainID};
		calls.push({...from, functionName: 'symbol'});
		calls.push({...from, functionName: 'decimals'});
		calls.push({...from, functionName: 'balanceOf', args: [address]});
		calls.push({...from, functionName: 'name'});
	}

	const data = await readContracts(config, {contracts: calls});
	const tokenInfoDictionary: Record<TAddress, {symbol: string; decimals: number; balanceOf: bigint; name: string}> =
		{};
	if (data.length < 4) {
		// Stop if we don't have enough data
		setIsLoadingInitialDB(false);
		return;
	}

	/******************************************************************************************
	 ** Once we have an array of those additional fields, we form a dictionary
	 ** with key of an address and additional fields as a value.
	 *****************************************************************************************/
	for (let i = 0; i < uniqueAllowancesByToken.length; i++) {
		const idx = i * 4;
		const symbol = data[idx].result;
		const decimals = data[idx + 1].result;
		const balanceOf = data[idx + 2].result;
		const name = data[idx + 3].result;
		tokenInfoDictionary[uniqueAllowancesByToken[i].address] = {
			symbol: symbol as string,
			decimals: decimals as number,
			balanceOf: balanceOf as bigint,
			name: name as string
		};
	}
	const spenderDictionary: Record<TAddress, {name: string}> = {};

	/******************************************************************************************
	 ** Here, we're making request to get names for each spender contract.
	 *****************************************************************************************/
	const responses = await Promise.allSettled(
		uniqueAllowancesBySpender.map(async (allowance): Promise<{spender: TAddress; name: string}> => {
			return {
				spender: allowance.args.sender,
				name: (await axios.get(`${contractDataURL}${allowance.chainID}/${allowance.args.sender}.json`)).data
					.name
			};
		})
	);
	for (const response of responses) {
		if (response.status === 'fulfilled') {
			spenderDictionary[response.value.spender] = {name: response.value.name};
		}
	}

	return {tokenInfoDictionary, spenderDictionary};
}
