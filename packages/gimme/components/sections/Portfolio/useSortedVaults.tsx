import {useCallback, useMemo, useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useRouter} from 'next/router';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {deserialize, serialize} from 'wagmi';
import {numberSort, percentOf} from '@builtbymom/web3/utils';
import {useDeepCompareEffect, useMountEffect} from '@react-hookz/web';
import {usePrices} from '@lib/contexts/usePrices';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import type {TDict, TNDict, TNormalizedBN, TSortDirection} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TPossibleSortBy = 'apy' | 'savings' | 'yield' | '';

export const useSortedVaults = (
	userVaultsArray: TYDaemonVault[],
	balances: TDict<TNormalizedBN>,
	allPrices: TNDict<TDict<TNormalizedBN>>
): {
	sortBy: TPossibleSortBy;
	sortDirection: TSortDirection;
	sortedVaults: TYDaemonVault[];
	onChangeSort: (sortDirection: TSortDirection, sortBy: TPossibleSortBy) => void;
} => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const {pricingHash} = usePrices();
	const {getStakingTokenBalance} = useVaults();
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');
	const [sortBy, set_sortBy] = useState<TPossibleSortBy>('');

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
			set_sortBy(_sortBy as TPossibleSortBy);
		}
	}, []);

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentBalanceIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/**********************************************************************************************
	 * Initially populate sortBy and sortDirection states with query values
	 *********************************************************************************************/
	useMountEffect((): void | VoidFunction => {
		const currentPage = new URL(window.location.href);
		handleQuery(new URLSearchParams(currentPage.search));
	});

	useDeepCompareEffect((): void | VoidFunction => {
		handleQuery(searchParams);
	}, [searchParams]);

	const sortedByAPY = useMemo((): TYDaemonVault[] => {
		if (!userVaultsArray || sortBy !== 'apy') {
			return userVaultsArray;
		}
		return userVaultsArray.toSorted((a, b): number =>
			numberSort({
				a: a.apr?.netAPR || 0,
				b: b.apr?.netAPR || 0,
				sortDirection
			})
		);
	}, [sortBy, sortDirection, userVaultsArray]);

	const sortyedBySavings = useMemo((): TYDaemonVault[] => {
		pricingHash;
		currentBalanceIdentifier;
		if (!userVaultsArray || sortBy !== 'savings') {
			return userVaultsArray;
		}
		if (Object.values(allPrices).length === 0 || Object.values(balances).length === 0) {
			return userVaultsArray;
		}

		return userVaultsArray.toSorted((a, b): number => {
			const aTokenPrice = allPrices?.[a.chainID]?.[a.token.address] || 0;
			const bTokenPrice = allPrices?.[b.chainID]?.[b.token.address] || 0;

			const aBalance = a.staking.available
				? getStakingTokenBalance({address: a.staking.address, chainID: a.chainID}).normalized
				: balances?.[a.address]?.normalized || 0;

			const bBalance = b.staking.available
				? getStakingTokenBalance({address: b.staking.address, chainID: b.chainID}).normalized
				: balances?.[b.address]?.normalized || 0;

			const aUsdValue = aBalance * aTokenPrice.normalized;
			const bUsdValue = bBalance * bTokenPrice.normalized;

			return numberSort({
				a: aUsdValue || 0,
				b: bUsdValue || 0,
				sortDirection
			});
		});
	}, [
		allPrices,
		balances,
		currentBalanceIdentifier,
		getStakingTokenBalance,
		pricingHash,
		sortBy,
		sortDirection,
		userVaultsArray
	]);

	const sortedByYield = useMemo(() => {
		pricingHash;
		if (!userVaultsArray || sortBy !== 'savings') {
			return userVaultsArray;
		}
		if (Object.values(allPrices).length === 0) {
			return userVaultsArray;
		}
		return userVaultsArray.toSorted((a, b): number => {
			pricingHash;
			currentBalanceIdentifier;
			const aTokenPrice = allPrices?.[a.chainID]?.[a.token.address] || 0;
			const bTokenPrice = allPrices?.[b.chainID]?.[b.token.address] || 0;

			const aBalance = a.staking.available
				? getStakingTokenBalance({address: a.staking.address, chainID: a.chainID}).normalized
				: balances?.[a.address]?.normalized || 0;

			const bBalance = b.staking.available
				? getStakingTokenBalance({address: b.staking.address, chainID: b.chainID}).normalized
				: balances?.[b.address]?.normalized || 0;

			const aYield = percentOf(aBalance, a.apr.netAPR * 100) * aTokenPrice.normalized;
			const bYield = percentOf(bBalance, b.apr.netAPR * 100) * bTokenPrice.normalized;

			return numberSort({
				a: aYield || 0,
				b: bYield || 0,
				sortDirection
			});
		});
	}, [
		allPrices,
		balances,
		currentBalanceIdentifier,
		getStakingTokenBalance,
		pricingHash,
		sortBy,
		sortDirection,
		userVaultsArray
	]);

	const stringifiedVaultList = serialize(userVaultsArray);
	const sortedVaults = useMemo((): TYDaemonVault[] => {
		const sortResult = deserialize(stringifiedVaultList) as TYDaemonVault[];

		if (sortBy === 'apy') {
			return sortedByAPY;
		}

		if (sortBy === 'savings') {
			return sortyedBySavings;
		}

		if (sortBy === 'yield') {
			return sortedByYield;
		}

		return sortResult;
	}, [stringifiedVaultList, sortBy, sortedByAPY, sortyedBySavings, sortedByYield]);

	const onChangeSort = useCallback(
		(newSortDirection: TSortDirection, newSortBy: TPossibleSortBy): void => {
			set_sortDirection(newSortDirection);

			const queryArgs: TDict<string | string[] | undefined> = {};
			for (const key in router.query) {
				if (key !== 'sortDirection' && key !== 'sortBy') {
					queryArgs[key] = router.query[key];
				}
			}

			if (!newSortDirection && newSortBy) {
				set_sortBy('');
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

	return {
		sortBy,
		sortDirection,
		sortedVaults,
		onChangeSort
	};
};
