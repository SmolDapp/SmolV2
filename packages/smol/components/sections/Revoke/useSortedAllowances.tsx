import {useCallback, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useRouter} from 'next/router';
import {deserialize, serialize} from 'wagmi';
import {numberSort, stringSort} from '@builtbymom/web3/utils';
import {useDeepCompareEffect, useMountEffect} from '@react-hookz/web';

import type {TDict, TSortDirection} from '@builtbymom/web3/types';
import type {TExpandedAllowance, TRevokeSortBy} from '@lib/types/Revoke';

export const useSortedAllowances = (
	allowances: TExpandedAllowance[]
): {
	sortBy: TRevokeSortBy;
	sortDirection: TSortDirection;
	sortedAllowances: TExpandedAllowance[] | undefined;
	onChangeSort: (sortDirection: TSortDirection, sortBy: TRevokeSortBy) => void;
} => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');
	const [sortBy, set_sortBy] = useState<TRevokeSortBy>(undefined);

	/**********************************************************************************************
	 ** This handleQuery function takes sortDirection and sortBy parameters from URL and updates
	 ** states.
	 *********************************************************************************************/
	const handleQuery = useCallback((_searchParams: URLSearchParams): void => {
		if (_searchParams.has('sortDirection')) {
			const _sortDirection = _searchParams.get('sortDirection');
			if (_sortDirection === null) {
				return;
			}
			set_sortDirection(_sortDirection as TSortDirection);
		}

		if (_searchParams.has('sortBy')) {
			const _sortBy = _searchParams.get('sortBy');
			if (_sortBy === null) {
				return;
			}
			set_sortBy(_sortBy as TRevokeSortBy);
		}
	}, []);

	/**********************************************************************************************
	 ** On mount of a hook we trigger handleQuery function to set states according to URL params.
	 *********************************************************************************************/
	useMountEffect((): void | VoidFunction => {
		const currentPage = new URL(window.location.href);
		handleQuery(new URLSearchParams(currentPage.search));
	});

	/**********************************************************************************************
	 ** If URL params changing, we call handleQuery function to update states.
	 *********************************************************************************************/
	useDeepCompareEffect((): void | VoidFunction => {
		handleQuery(searchParams);
	}, [searchParams]);

	/**********************************************************************************************
	 ** This is memoized sorted by token allowances.
	 *********************************************************************************************/
	const sortedByToken = useMemo((): TExpandedAllowance[] | undefined => {
		if (allowances.length < 1) {
			return;
		}
		return allowances.toSorted((a, b): number =>
			stringSort({
				a: a.symbol,
				b: b.symbol,
				sortDirection
			})
		);
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by spender allowances.
	 *********************************************************************************************/
	const sortedBySpender = useMemo((): TExpandedAllowance[] | undefined => {
		if (allowances.length < 1) {
			return;
		}
		return allowances?.toSorted((a, b): number =>
			stringSort({
				a: a.args.sender,
				b: b.args.sender,
				sortDirection
			})
		);
	}, [allowances, sortDirection]);

	/**********************************************************************************************
	 ** This is memoized sorted by value allowances.
	 *********************************************************************************************/
	const sortedByAmount = useMemo((): TExpandedAllowance[] | undefined => {
		if (allowances.length < 1) {
			return;
		}
		return allowances?.toSorted((a, b): number =>
			numberSort({
				a: Number(a.args.value),
				b: Number(b.args.value),
				sortDirection
			})
		);
	}, [allowances, sortDirection]);

	const stringifiedAllowancesList = serialize(allowances);

	/**********************************************************************************************
	 ** This is memoized sorted allowances that contains allowances according to sortBy state.
	 *********************************************************************************************/
	const sortedAllowances = useMemo(() => {
		const sortResult = deserialize(stringifiedAllowancesList) as TExpandedAllowance[];
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
	}, [sortBy, sortedByAmount, sortedBySpender, sortedByToken, stringifiedAllowancesList]);

	/**********************************************************************************************
	 ** This is onChangeSort function that changes both are states and URL params.
	 *********************************************************************************************/
	const onChangeSort = useCallback(
		(newSortDirection: TSortDirection, newSortBy: TRevokeSortBy): void => {
			set_sortDirection(newSortDirection);

			const queryArgs: TDict<string | string[] | undefined> = {};
			for (const key in router.query) {
				if (key !== 'sortDirection' && key !== 'sortBy') {
					queryArgs[key] = router.query[key];
				}
			}

			if (!newSortDirection && newSortBy) {
				set_sortBy(undefined);
				queryArgs.sortDirection = undefined;
				queryArgs.sortBy = undefined;
				delete queryArgs.sortDirection;
				delete queryArgs.sortBy;

				router.replace({pathname: router.pathname, query: queryArgs}, undefined, {shallow: true});
				return;
			}
			set_sortBy(newSortBy);
			queryArgs.sortDirection = newSortDirection;
			queryArgs.sortBy = newSortBy;
			router.replace({pathname: router.pathname, query: queryArgs}, undefined, {shallow: true});
		},
		[router]
	);

	return {sortBy, sortDirection, onChangeSort, sortedAllowances};
};
