import {Fragment, type ReactElement, type ReactNode, useCallback, useMemo, useState} from 'react';
import IconChevronPlain from 'packages/lib/icons/IconChevronPlain';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatAmount, isAddress, toAddress} from '@builtbymom/web3/utils';
import {EmptyView} from '@lib/common/EmptyView';
import {IconSpinner} from '@lib/icons/IconSpinner';

import {AllowanceItem} from './AllowanceItem';
import {AllowanceRow} from './AllowanceRow';
import {useAllowances} from './useAllowances';

import type {TAllowancesTableProps, TRevokeSort, TRevokeSortBy} from '@lib/types/Revoke';

function TokenFetchingLoader(): ReactElement {
	const {isDoneWithInitialFetch, allowanceFetchingFromBlock, allowanceFetchingToBlock} = useAllowances();

	if (isDoneWithInitialFetch) {
		return <Fragment />;
	}

	return (
		<div className={'mt-10 flex flex-col items-center justify-center gap-4'}>
			<IconSpinner className={'size-6'} />
			<div className={'relative h-2 w-full overflow-hidden rounded-lg bg-neutral-300'}>
				<div
					className={'bg-primary absolute inset-y-0 left-0 size-full'}
					style={{
						width: `${(Number(allowanceFetchingFromBlock) / Number(allowanceFetchingToBlock || 1)) * 100}%`,
						transition: 'width 0.5s',
						zIndex: 1031
					}}
				/>
			</div>
			<p className={'text-xs text-neutral-600'}>
				{allowanceFetchingToBlock === 0n
					? 'Analyzing past blocks ...'
					: `Analyzing past blocks ${formatAmount((Number(allowanceFetchingFromBlock) / Number(allowanceFetchingToBlock)) * 100, 2, 2)}%`}
			</p>
		</div>
	);
}

export const AllowancesTable = ({revoke, prices}: TAllowancesTableProps): ReactElement => {
	const {filteredAllowances: allowances, isLoading, isDoneWithInitialFetch} = useAllowances();
	const isFetchingData = !isDoneWithInitialFetch || isLoading;
	const hasNothingToRevoke = (!allowances || allowances.length === 0) && !isFetchingData;
	const {address, onConnect} = useWeb3();

	const [sort, set_sort] = useState<TRevokeSort>({sortBy: undefined, asc: true});

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

	/**********************************************************************************************
	 ** This function sets sort for each column we want to sort separately.
	 *********************************************************************************************/
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

	/**********************************************************************************************
	 ** This function returns the correct icon, according to current sort state.
	 *********************************************************************************************/
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

	const allowancesLayout = useMemo((): ReactNode => {
		if (!isAddress(address)) {
			return (
				<div className={'max-w-108'}>
					<EmptyView onConnect={onConnect} />
				</div>
			);
		}
		if (hasNothingToRevoke) {
			return (
				<div className={'flex w-full justify-center'}>
					<p>{'Nothing to revoke!'}</p>
				</div>
			);
		}

		if (isFetchingData) {
			return <TokenFetchingLoader />;
		}

		if (sortedAllowances && sortedAllowances.length > 0) {
			return (
				<>
					<table
						className={
							'hidden w-full border-separate border-spacing-y-4 text-left text-sm text-gray-500 md:table md:w-full rtl:text-right dark:text-gray-400'
						}>
						<thead className={'w-full text-xs'}>
							<tr>
								<th className={'font-light text-neutral-500'}>
									<button
										onClick={() => onSetSort('token')}
										className={cl(
											'flex items-center hover:text-neutral-800',
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
											'flex items-center  hover:text-neutral-800',
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
												'flex items-center hover:text-neutral-800 justify-end',
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

						<tbody
							suppressHydrationWarning
							className={'w-full'}>
							{sortedAllowances?.map(item => (
								<AllowanceRow
									key={`${item.blockNumber}-${item.logIndex}`}
									allowance={item}
									revoke={revoke}
									price={prices?.[toAddress(item.address)]}
								/>
							))}
						</tbody>
					</table>
					<div className={'flex flex-col gap-y-2 md:hidden'}>
						{allowances?.map(item => (
							<AllowanceItem
								key={`${item.blockNumber}-${item.logIndex}`}
								revoke={revoke}
								allowance={item}
								price={prices?.[toAddress(item.address)]}
							/>
						))}
					</div>
				</>
			);
		}

		return (
			<div className={'max-w-108'}>
				<EmptyView />
			</div>
		);
	}, [
		address,
		allowances,
		getIconPlain,
		hasNothingToRevoke,
		isFetchingData,
		onConnect,
		onSetSort,
		prices,
		revoke,
		sort.sortBy,
		sortedAllowances
	]);

	return <>{allowancesLayout}</>;
};