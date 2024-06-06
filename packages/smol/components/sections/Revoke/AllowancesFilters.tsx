import {type ReactElement, useCallback, useMemo} from 'react';
import {cl} from '@builtbymom/web3/utils';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';

import {AssetFilterDropdown} from './AssetFilterDropdown';
import {SpenderFilterDropdown} from './SpenderFilterDropdown';
import {useAllowances} from './useAllowances';

import type {TUnlimitedFilter, TWithBalanceFilter} from '@lib/types/Revoke';

export const AllowancesFilters = (): ReactElement | null => {
	const {dispatchConfiguration, configuration, allowances} = useAllowances();

	/**********************************************************************************************
	 ** Here we get non-repetitive tokens by token address and sender
	 ** and form new arrays to have filters for original arrays
	 *********************************************************************************************/
	const uniqueAllowancesByToken = useMemo(() => {
		return [...new Map(allowances?.map(item => [item.address, item])).values()];
	}, [allowances]);

	const uniqueAllowancesBySpender = useMemo(() => {
		return [...new Map(allowances?.map(item => [item.spenderName, item])).values()];
	}, [allowances]);

	/**********************************************************************************************
	 ** This is an array of all unique allowances with only required for spender filter fields.
	 *********************************************************************************************/
	const allSpenderOptions = useMemo(() => {
		return uniqueAllowancesBySpender.map(item => {
			return {
				address: item.args.sender,
				symbol: item.symbol,
				chainID: item.chainID,
				displayName: item.args.sender,
				args: item.args,
				spenderName: item.spenderName
			};
		});
	}, [uniqueAllowancesBySpender]);

	/**********************************************************************************************
	 ** This is an array of all unique allowances with only required for token filter fields.
	 *********************************************************************************************/
	const allTokenOptions = useMemo(() => {
		return uniqueAllowancesByToken.map(item => {
			return {
				address: item.address,
				symbol: item.symbol,
				chainID: item.chainID,
				displayName: item.symbol,
				args: item.args,
				spenderName: item.spenderName
			};
		});
	}, [uniqueAllowancesByToken]);

	/**********************************************************************************************
	 ** This function sets unlimited filter. If we click on filter button, when it's already
	 ** set up, it will change it to undefined, to reset the filter.
	 *********************************************************************************************/
	const onDispatchUnlimitedFilter = useCallback(
		(filter: TUnlimitedFilter) => {
			dispatchConfiguration({
				type: 'SET_FILTER',
				payload:
					configuration.allowancesFilters.unlimited.filter === filter
						? {...configuration.allowancesFilters, unlimited: {filter: undefined}}
						: {...configuration.allowancesFilters, unlimited: {filter}}
			});
		},
		[configuration.allowancesFilters, dispatchConfiguration]
	);

	/**********************************************************************************************
	 ** This function sets with-balance filter. If we click on filter button, when it's already
	 ** set up, it will change it to undefined, to reset the filter.
	 *********************************************************************************************/
	const onDispatchWithBalanceFilter = useCallback(
		(filter: TWithBalanceFilter) => {
			dispatchConfiguration({
				type: 'SET_FILTER',
				payload:
					configuration.allowancesFilters.withBalance.filter === filter
						? {...configuration.allowancesFilters, withBalance: {filter: undefined}}
						: {...configuration.allowancesFilters, withBalance: {filter}}
			});
		},
		[configuration.allowancesFilters, dispatchConfiguration]
	);

	/**********************************************************************************************
	 ** This function resets all filters for allowances.
	 *********************************************************************************************/
	const onResetFilters = (): void => dispatchConfiguration({type: 'RESET_FILTER'});

	return (
		<div className={'flex flex-col'}>
			<div className={'mr-4 flex items-center pb-2 pt-4'}>
				<p className={'mr-2 text-xs text-neutral-800'}>{'Filters'}</p>
				<button
					onClick={onResetFilters}
					className={'text-xs text-neutral-600 underline'}>
					{'Clear'}
				</button>
			</div>
			<div className={'mb-6 grid grid-cols-3 gap-3 md:mb-2 md:flex md:gap-y-3'}>
				<AssetFilterDropdown allOptions={allTokenOptions}>
					<div
						className={cl(
							'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 h-12 md:h-8 font-medium md:font-normal  justify-center',
							configuration.allowancesFilters.asset.filter.length
								? 'bg-neutral-400 hover:bg-neutral-600'
								: ''
						)}>
						<div className={'flex items-center gap-x-1 px-3 py-2'}>
							<p className={'text-xs leading-4'}>
								{`Select Asset ${configuration.allowancesFilters.asset.filter.length ? ` (${configuration.allowancesFilters.asset.filter.length})` : ''}`}
							</p>
							<IconChevronBottom className={'ml-2 size-4'} />
						</div>
					</div>
				</AssetFilterDropdown>
				<SpenderFilterDropdown allOptions={allSpenderOptions}>
					<div
						className={cl(
							'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 justify-center h-12 font-medium ',
							'md:h-8 md:font-normal',
							configuration.allowancesFilters.spender.filter.length
								? 'bg-neutral-400 hover:bg-neutral-400'
								: ''
						)}>
						<div className={'flex items-center gap-x-1 px-3 py-2'}>
							<p className={'text-xs leading-4'}>
								{`Select Spender ${configuration.allowancesFilters.spender.filter.length ? ` (${configuration.allowancesFilters.spender.filter.length})` : ''}`}
							</p>
							<IconChevronBottom className={'ml-2 size-4'} />
						</div>
					</div>
				</SpenderFilterDropdown>
				<button
					onClick={() => onDispatchUnlimitedFilter('unlimited')}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.unlimited.filter === 'unlimited'
							? 'bg-neutral-400 hover:bg-neutral-400'
							: ''
					)}>
					<p className={'px-3 py-2 text-xs leading-4'}>{'Unlimited'}</p>
				</button>
				<button
					onClick={() => onDispatchUnlimitedFilter('limited')}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.unlimited.filter === 'limited'
							? 'bg-neutral-400 hover:bg-neutral-400'
							: ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Limited'}</p>
				</button>

				<button
					onClick={() => onDispatchWithBalanceFilter('with-balance')}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters?.withBalance.filter === 'with-balance'
							? 'bg-neutral-400 hover:bg-neutral-400'
							: ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'With balance'}</p>
				</button>

				<button
					onClick={() => onDispatchWithBalanceFilter('without-balance')}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 hover:bg-neutral-300 justify-center h-12 font-medium',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.withBalance.filter === 'without-balance'
							? 'bg-neutral-400 hover:bg-neutral-400'
							: ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Without balance'}</p>
				</button>
			</div>
		</div>
	);
};
