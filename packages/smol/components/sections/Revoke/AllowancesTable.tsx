import {IconSpinner} from 'packages/lib/icons/IconSpinner';

import {AllowanceRow} from './AllowanceRow';
import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAllowance} from './useAllowances';

type TAllowancesTableProps = {
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowancesTable = ({revoke}: TAllowancesTableProps): ReactElement => {
	const {allowances, isLoading, isDoneWithInitialFetch} = useAllowances();
	const isFetchingData = !isDoneWithInitialFetch || isLoading;

	return (
		<>
			{(!allowances || allowances.length === 0) && !isFetchingData ? (
				<div>{'No allowances'}</div>
			) : (
				<table
					className={
						'mt-10 w-full border-separate border-spacing-y-4 text-left text-sm text-gray-500 rtl:text-right dark:text-gray-400'
					}>
					<thead className={'bg-gray-50 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400'}>
						<tr>
							<th className={'font-medium'}>{'Asset'}</th>
							<th className={'text-right font-light text-neutral-500'}>{'Amount'}</th>
							<th className={'px-6 text-right font-light text-neutral-500'}>{'Spender'}</th>
							<th className={'px-6 font-medium'}></th>
						</tr>
					</thead>
					<tbody
						suppressHydrationWarning
						className={'w-full'}>
						{allowances?.map(item => (
							<>
								<AllowanceRow
									key={item.transactionHash}
									allowance={item}
									revoke={revoke}
								/>
							</>
						))}
					</tbody>
				</table>
			)}
			{isFetchingData && (
				<div className={'mt-10 flex items-center justify-center'}>
					<IconSpinner className={'size-6'} />
				</div>
			)}
		</>
	);
};
