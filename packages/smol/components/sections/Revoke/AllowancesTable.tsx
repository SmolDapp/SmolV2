import {type ReactElement, useCallback, useMemo, useState} from 'react';
import IconChevronPlain from 'packages/lib/icons/IconChevronPlain';
import {IconSpinner} from 'packages/lib/icons/IconSpinner';
import {cl} from '@builtbymom/web3/utils';

import {AllowanceItem} from './AllowanceItem';
import {AllowanceRow} from './AllowanceRow';
import {useAllowances} from './useAllowances';

import type {TAddress} from '@builtbymom/web3/types';
import type {TRevokeSort, TRevokeSortBy, TTokenAllowance} from '@lib/types/Revoke';

type TAllowancesTableProps = {
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowancesTable = ({revoke}: TAllowancesTableProps): ReactElement => {
	const {filteredAllowances: allowances, isLoading, isDoneWithInitialFetch} = useAllowances();
	const isFetchingData = !isDoneWithInitialFetch || isLoading;
	const hasNothingToRevoke = (!allowances || allowances.length === 0) && !isFetchingData;

	const [sort, set_sort] = useState<TRevokeSort>({sortBy: null, asc: true});

	/**********************************************************************************************
	 ** Sorting allowances by amount, spender and token. All of them are sorted ether asc or desc
	 ** order. If sortings are not selected we return allowances in the initial timestamp order.
	 *********************************************************************************************/
	const sortedAllowances = useMemo(() => {
		if (!allowances) {
			return;
		}

		if (sort.sortBy === 'amount') {
			return allowances?.toSorted((a, b) =>
				sort.asc ? (a.args.value! > b.args.value! ? -1 : 1) : a.args.value! < b.args.value! ? -1 : 1
			);
		}

		if (sort.sortBy === 'spender') {
			return allowances?.toSorted((a, b) =>
				sort.asc ? b.args.sender.localeCompare(a.args.sender) : a.args.sender.localeCompare(b.args.sender)
			);
		}

		if (sort.sortBy === 'token') {
			return allowances?.toSorted((a, b) =>
				a.symbol && b.symbol
					? sort.asc
						? b.symbol?.localeCompare(a.symbol)
						: a.symbol?.localeCompare(b.symbol)
					: 0
			);
		}

		return allowances;
	}, [allowances, sort.asc, sort.sortBy]);

	const onSetSort = useCallback(
		(sortBy: TRevokeSortBy) => {
			set_sort(prev => {
				return {
					...sort,
					sortBy,
					asc: prev.sortBy === sortBy ? !prev.asc : prev.asc
				};
			});
		},
		[sort]
	);

	const getIconPlain = useCallback(
		(sortBy: TRevokeSortBy) => {
			return sort.sortBy === sortBy && !sort.asc ? (
				<IconChevronPlain className={'ml-1 size-4 rotate-180'} />
			) : sort.sortBy === sortBy && sort.asc ? (
				<IconChevronPlain className={'ml-1 size-4'} />
			) : (
				<IconChevronPlain className={'ml-1 size-4'} />
			);
		},
		[sort.asc, sort.sortBy]
	);

	return (
		<>
			{hasNothingToRevoke ? (
				<div className={'flex w-full justify-center'}>
					<p>{'Nothing to revoke!'}</p>
				</div>
			) : (
				<>
					<table
						className={
							'hidden w-full border-separate border-spacing-y-4 text-left text-sm text-gray-500 md:table md:w-full rtl:text-right dark:text-gray-400'
						}>
						{!isFetchingData && (
							<thead className={'w-full text-xs'}>
								<tr>
									<th className={'font-light text-neutral-500'}>
										<button
											onClick={() => onSetSort('token')}
											className={cl(
												'flex items-center',
												sort.sortBy === 'token' ? 'text-neutral-800' : ''
											)}>
											<p>{'Asset'}</p>
											{getIconPlain('token')}
										</button>
									</th>
									<th className={'flex justify-end font-light text-neutral-500'}>
										<button
											onClick={() => onSetSort('amount')}
											className={cl(
												'flex items-center text-neutral-600',
												sort.sortBy === 'amount' ? 'text-neutral-800' : ''
											)}>
											<p>{'Amount'}</p>
											{getIconPlain('amount')}
										</button>
									</th>
									<th className={'px-6 font-light text-neutral-500'}>
										<div className={'flex justify-end'}>
											<button
												onClick={() => onSetSort('spender')}
												className={cl(
													'flex items-center justify-end',
													sort.sortBy === 'spender' ? 'text-neutral-800' : ''
												)}>
												<p>{'Spender'}</p>
												{getIconPlain('spender')}
											</button>
										</div>
									</th>
									<th className={'px-6 font-medium'}></th>
								</tr>
							</thead>
						)}
						<tbody
							suppressHydrationWarning
							className={'w-full'}>
							{sortedAllowances?.map(item => (
								<AllowanceRow
									allowance={item}
									revoke={revoke}
								/>
							))}
						</tbody>
					</table>
					<div className={'flex flex-col gap-y-2 md:hidden'}>
						{allowances?.map(item => (
							<AllowanceItem
								revoke={revoke}
								allowance={item}
							/>
						))}
					</div>
				</>
			)}
			{isFetchingData && (
				<div className={'mt-10 flex items-center justify-center'}>
					<IconSpinner className={'size-6'} />
				</div>
			)}
		</>
	);
};
