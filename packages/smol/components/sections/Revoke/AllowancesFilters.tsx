import {IconPlus} from 'packages/lib/icons/IconPlus';
import {cl} from '@builtbymom/web3/utils';

import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';

// WIP- filters

export const AllowancesFilters = (): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	return (
		<div className={'flex flex-col'}>
			<div className={'mr-4 py-2 text-xs text-neutral-600 transition-colors '}>{'Filters'}</div>
			<div className={'flex gap-x-3'}>
				<button className={'flex items-center rounded-md bg-neutral-200'}>
					<div className={'flex items-center gap-x-1 px-3 py-2'}>
						<IconPlus className={'size-3'} />
						<p className={'text-xs leading-4'}>{'Asset'}</p>
					</div>
				</button>
				<button className={'flex items-center rounded-md bg-neutral-200'}>
					<div className={'flex items-center gap-x-1 px-3 py-2'}>
						<IconPlus className={'size-3'} />
						<p className={'text-xs leading-4'}>{' Spender'}</p>
					</div>
				</button>
				<button
					onClick={() => dispatchConfiguration({type: 'SET_UNLIMITED_FILTER', payload: 'unlimited'})}
					className={cl(
						'flex items-center rounded-md bg-neutral-200',
						configuration.unlimitedFilter === 'unlimited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'px-3 py-2 text-xs leading-4'}>{'Unlimited'}</p>
				</button>
				<button
					onClick={() => dispatchConfiguration({type: 'SET_UNLIMITED_FILTER', payload: 'limited'})}
					className={cl(
						'flex items-center rounded-md bg-neutral-200',
						configuration.unlimitedFilter === 'limited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Limited'}</p>
				</button>

				{/* <button
					onClick={() => dispatchConfiguration({type: 'SET_UNLIMITED_FILTER', payload: 'limited'})}
					className={cl(
						'flex items-center rounded-md bg-neutral-200',
						configuration.unlimitedFilter === 'limited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'With balance'}</p>
				</button>

				<button
					onClick={() => dispatchConfiguration({type: 'SET_UNLIMITED_FILTER', payload: 'limited'})}
					className={cl(
						'flex items-center rounded-md bg-neutral-200',
						configuration.unlimitedFilter === 'limited' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Without balance'}</p>
				</button> */}
			</div>
		</div>
	);
};
