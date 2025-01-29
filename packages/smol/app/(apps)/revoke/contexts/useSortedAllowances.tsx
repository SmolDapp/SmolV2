'use client';

import {toNormalizedValue} from '@lib/utils/numbers';
import {toAddress} from 'lib/utils/tools.addresses';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useMemo} from 'react';
import {deserialize, serialize} from 'wagmi';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TExpandedAllowance, TRevokeSortBy} from 'packages/smol/app/(apps)/revoke/types';

const stringSort = ({a, b, sortDirection}: {a: string; b: string; sortDirection: 'asc' | 'desc' | ''}): number =>
	sortDirection === 'desc' ? a.localeCompare(b) : b.localeCompare(a);

const numberSort = ({a, b, sortDirection}: {a?: number; b?: number; sortDirection: 'asc' | 'desc' | ''}): number =>
	sortDirection === 'desc' ? (b ?? 0) - (a ?? 0) : (a ?? 0) - (b ?? 0);

export const useSortedAllowances = (
	allowances: TExpandedAllowance[],
	prices?: Record<TAddress, TNormalizedBN>
): {
	sortBy: TRevokeSortBy;
	sortDirection: 'asc' | 'desc' | '';
	sortedAllowances: TExpandedAllowance[] | undefined;
} => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sortDirection = searchParams?.get('sortDirection');
	const sortBy = searchParams?.get('sortBy');

	/**********************************************************************************************
	 ** If sortDirection is empty we show the array in original order, and also we need to clean the
	 ** url.
	 *********************************************************************************************/
	useEffect(() => {
		if (!sortDirection && sortBy) {
			router.push('');
		}
	}, [router, sortBy, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by token allowances.
	 *********************************************************************************************/
	const sortedByToken = useMemo((): TExpandedAllowance[] => {
		return allowances?.length
			? allowances.toSorted((a, b): number =>
					stringSort({
						a: a.symbol,
						b: b.symbol,
						sortDirection: sortDirection as 'asc' | 'desc' | ''
					})
				)
			: [];
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by spender allowances.
	 *********************************************************************************************/
	const sortedBySpender = useMemo((): TExpandedAllowance[] => {
		return allowances?.length
			? allowances.toSorted((a, b): number => {
					const sortABy = a.spenderName && a.spenderName !== b.spenderName ? a.spenderName : a.args.sender;
					const sortBBy = b.spenderName && b.spenderName !== a.spenderName ? b.spenderName : b.args.sender;
					return stringSort({
						a: sortABy,
						b: sortBBy,
						sortDirection: sortDirection as 'asc' | 'desc' | ''
					});
				})
			: [];
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by value allowances.
	 *********************************************************************************************/
	const sortedByAmount = useMemo((): TExpandedAllowance[] => {
		return allowances?.length
			? allowances.toSorted((a, b): number => {
					if (!a || !b || !prices) {
						return 0;
					}

					const amountAInUSD =
						toNormalizedValue(a.args.value as bigint, a.decimals) > a.balanceOf.normalized
							? a.balanceOf.normalized * prices[toAddress(a.address)]?.normalized
							: toNormalizedValue(a.args.value as bigint, a.decimals) *
								prices[toAddress(a.address)]?.normalized;

					const amountBInUSD =
						toNormalizedValue(b.args.value as bigint, b.decimals) > b.balanceOf.normalized
							? b.balanceOf.normalized * prices[toAddress(b.address)]?.normalized
							: toNormalizedValue(b.args.value as bigint, b.decimals) *
								prices[toAddress(b.address)]?.normalized;

					return numberSort({
						a: amountAInUSD || 0,
						b: amountBInUSD || 0,
						sortDirection: sortDirection as 'asc' | 'desc' | ''
					});
				})
			: [];
	}, [allowances, prices, sortDirection]);
	const stringifiedAllowancesList = serialize(allowances) ?? '{}';

	/**********************************************************************************************
	 ** This is memoized sorted allowances that contains allowances according to sortBy state.
	 *********************************************************************************************/
	const sortedAllowances = useMemo(() => {
		const sortResult = deserialize(stringifiedAllowancesList) as TExpandedAllowance[];
		if (sortDirection === '') {
			return sortResult;
		}
		if (sortBy === 'amount') {
			return sortedByAmount;
		}

		if (sortBy === 'spender') {
			return sortedBySpender;
		}

		if (sortBy === 'token') {
			return sortedByToken;
		}
		return sortResult;
	}, [sortBy, sortDirection, sortedByAmount, sortedBySpender, sortedByToken, stringifiedAllowancesList]);

	return {
		sortBy: sortBy as TRevokeSortBy,
		sortDirection: sortDirection as 'asc' | 'desc' | '',
		sortedAllowances
	};
};
