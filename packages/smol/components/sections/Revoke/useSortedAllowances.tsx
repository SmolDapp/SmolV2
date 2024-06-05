import {useEffect, useMemo} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {deserialize, serialize} from 'wagmi';
import {bigNumberSort, stringSort} from '@builtbymom/web3/utils';

import type {TSortDirection} from '@builtbymom/web3/types';
import type {TExpandedAllowance, TRevokeSortBy} from '@lib/types/Revoke';

export const useSortedAllowances = (
	allowances: TExpandedAllowance[]
): {
	sortBy: TRevokeSortBy;
	sortDirection: TSortDirection;
	sortedAllowances: TExpandedAllowance[] | undefined;
} => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const sortDirection = searchParams.get('sortDirection');
	const sortBy = searchParams.get('sortBy');

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
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by spender allowances.
	 *********************************************************************************************/
	const sortedBySpender = useMemo((): TExpandedAllowance[] => {
		return allowances?.length
			? allowances.toSorted((a, b): number =>
					stringSort({
						a: a.args.sender || '',
						b: b.args.sender || '',
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by value allowances.
	 *********************************************************************************************/
	const sortedByAmount = useMemo((): TExpandedAllowance[] => {
		return allowances?.length
			? allowances.toSorted((a, b): number =>
					bigNumberSort({
						a: (a.args.value as bigint) || 0n,
						b: (b.args.value as bigint) || 0n,
						sortDirection: sortDirection as TSortDirection
					})
				)
			: [];
	}, [allowances, sortDirection]);
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
		sortDirection: sortDirection as TSortDirection,
		sortedAllowances
	};
};
