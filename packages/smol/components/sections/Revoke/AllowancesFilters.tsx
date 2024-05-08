import {cl} from '@builtbymom/web3/utils';

import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';

// WIP- filters

export const AllowancesFilters = (): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	return (
		<div className={'flex flex-col'}>
			<div className={'mr-4 py-2 text-xs text-neutral-600 transition-colors '}>{'Filters'}</div>
			<div className={'flex'}>
				<button
					onClick={() => dispatchConfiguration({type: 'SET_STABLES_FILTER', payload: 'stables'})}
					className={cl(
						'mr-3 flex items-center rounded-md bg-neutral-200',
						configuration.stablesFilter === 'stables' ? 'bg-neutral-400' : ''
					)}>
					<p className={'px-3 py-2 text-xs leading-4'}>{'Stables'}</p>
				</button>
				<button
					onClick={() => dispatchConfiguration({type: 'SET_STABLES_FILTER', payload: 'non-stables'})}
					className={cl(
						'flex items-center rounded-md bg-neutral-200',
						configuration.stablesFilter === 'non-stables' ? 'bg-neutral-400' : ''
					)}>
					<p className={'flex items-center rounded-md px-3 py-2 text-xs leading-4'}>{'Non-Stables'}</p>
				</button>
			</div>
		</div>
	);
};
