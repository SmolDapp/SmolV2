import {AllowanceRow} from './AllowanceRow';
import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAllowance} from './useAllowances';

type TAllowancesTableProps = {
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowancesTable = ({revoke}: TAllowancesTableProps): ReactElement => {
	const {allowances} = useAllowances();

	const noAllowances = <div>{'No allowances'}</div>;

	return (
		<>
			{allowances?.length === 0 || allowances === null ? (
				noAllowances
			) : (
				<table className={'text-gray-500 dark:text-gray-400 w-full text-left text-sm rtl:text-right'}>
					<thead className={'text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400 text-xs uppercase'}>
						<tr>
							<th className={'px-6 py-3'}>{'Address'}</th>
							<th className={'px-6 py-3'}>{'Token'}</th>
							<th className={'px-6 py-3'}>{'Amount'}</th>
							<th className={'px-6 py-3'}>{'Revoke'}</th>
						</tr>
					</thead>
					<tbody className={'w-full'}>
						{allowances?.map(item => (
							<AllowanceRow
								key={item.transactionHash}
								allowance={item}
								revoke={revoke}
							/>
						))}
					</tbody>
				</table>
			)}
		</>
	);
};