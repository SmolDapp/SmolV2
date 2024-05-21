import {type ReactElement, useMemo} from 'react';
import {IconPlus} from 'packages/lib/icons/IconPlus';
import {cl} from '@builtbymom/web3/utils';
import IconRefresh from '@multisafeIcons/IconRefresh';

import {AssetFilterDropdown} from './AssetFilterDropdown';
import {SpenderFilterDropdown} from './SpenderFilterDropdown';
import {useAllowances} from './useAllowances';

export const AllowancesFilters = (): ReactElement | null => {
	const {dispatchConfiguration, configuration, allowances} = useAllowances();

	/****************************************************************
	 * Here we get non-repetitive tokens by token address and sender
	 * and form new arrays to have filters for original arrays
	 ****************************************************************/
	const uniqueAllowancesByToken = useMemo(() => {
		return [...new Map(allowances?.map(item => [item.address, item])).values()];
	}, [allowances]);

	const uniqueAllowancesBySpender = useMemo(() => {
		return [...new Map(allowances?.map(item => [item.args.sender, item])).values()];
	}, [allowances]);

	if (!allowances) {
		return null;
	}

	return (
		<div className={'flex flex-col'}>
			<div className={'mr-4 flex  pb-2 pt-4'}>
				<p className={'mr-2 text-xs text-neutral-600 '}>{'Filters'}</p>
				<button onClick={() => dispatchConfiguration({type: 'RESET_FILTER'})}>
					<IconRefresh className={'size-3 text-neutral-600 transition-colors hover:text-neutral-900'} />
				</button>
			</div>
			<div className={'mb-6 grid grid-cols-3 gap-3 md:flex md:gap-y-3'}>
				<AssetFilterDropdown
					allOptions={uniqueAllowancesByToken.map(item => {
						return {
							address: item.address,
							symbol: item.symbol,
							transactionHash: item.transactionHash,
							displayName: item.symbol,
							args: item.args
						};
					})}>
					<div
						className={cl(
							'flex items-center rounded-md bg-neutral-200 h-12 md:h-8 font-medium md:font-normal  justify-center',
							configuration.allowancesFilters.asset.filter.length ? 'bg-neutral-400' : ''
						)}>
						<div className={'flex items-center gap-x-1 px-3 py-2'}>
							<IconPlus className={'size-3'} />
							<p className={'text-xs leading-4'}>{'Asset'}</p>
						</div>
					</div>
				</AssetFilterDropdown>
				<SpenderFilterDropdown
					allOptions={uniqueAllowancesBySpender.map(item => {
						return {
							address: item.args.sender,
							symbol: item.symbol,
							transactionHash: item.transactionHash,
							displayName: item.args.sender,
							args: item.args
						};
					})}>
					<div
						className={cl(
							'flex items-center rounded-md bg-neutral-200 justify-center h-12 font-medium ',
							'md:h-8 md:font-normal',
							configuration.allowancesFilters.spender.filter.length ? 'bg-neutral-400' : ''
						)}>
						<div className={'flex items-center gap-x-1 px-3 py-2'}>
							<IconPlus className={'size-3'} />
							<p className={'text-xs leading-4'}>{' Spender'}</p>
						</div>
					</div>
				</SpenderFilterDropdown>
				<button
					onClick={() =>
						dispatchConfiguration({
							type: 'SET_FILTER',
							payload: configuration.allowancesFilters.unlimited.filter
								? {...configuration.allowancesFilters, unlimited: {filter: null}}
								: {...configuration.allowancesFilters, unlimited: {filter: 'unlimited'}}
						})
					}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.unlimited.filter === 'unlimited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'px-3 py-2 text-xs leading-4'}>{'Unlimited'}</p>
				</button>
				<button
					onClick={() =>
						dispatchConfiguration({
							type: 'SET_FILTER',
							payload: configuration.allowancesFilters.unlimited.filter
								? {...configuration.allowancesFilters, unlimited: {filter: null}}
								: {...configuration.allowancesFilters, unlimited: {filter: 'limited'}}
						})
					}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.unlimited.filter === 'limited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Limited'}</p>
				</button>

				<button
					onClick={() =>
						dispatchConfiguration({
							type: 'SET_FILTER',
							payload: configuration.allowancesFilters.withBalance.filter
								? {...configuration.allowancesFilters, withBalance: {filter: null}}
								: {...configuration.allowancesFilters, withBalance: {filter: 'with-balance'}}
						})
					}
					className={cl(
						'flex items-center rounded-md bg-neutral-200  justify-center h-12 font-medium ',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters?.withBalance.filter === 'with-balance' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'With balance'}</p>
				</button>

				<button
					onClick={() =>
						dispatchConfiguration({
							type: 'SET_FILTER',
							payload: configuration.allowancesFilters.withBalance.filter
								? {...configuration.allowancesFilters, withBalance: {filter: null}}
								: {...configuration.allowancesFilters, withBalance: {filter: 'without-balance'}}
						})
					}
					className={cl(
						'flex items-center rounded-md bg-neutral-200 justify-center h-12 font-medium',
						'md:h-8 md:font-normal',
						configuration.allowancesFilters.withBalance.filter === 'without-balance' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Without balance'}</p>
				</button>
			</div>
		</div>
	);
};
