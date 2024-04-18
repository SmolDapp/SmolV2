import {AllowanceRow} from './AllowanceRow';
import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenToRevoke} from './Wizard';

type TAllowancesTableProps = {
	revoke: (tokenToRevoke: TTokenToRevoke, spender: TAddress) => void;
};

export const AllowancesTable = ({revoke}: TAllowancesTableProps): ReactElement => {
	const {allowances} = useAllowances();
	return (
		<table className={'w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'}>
			<thead className={'text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'}>
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
	);
};
