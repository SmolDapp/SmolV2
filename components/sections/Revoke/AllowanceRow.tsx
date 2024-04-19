import {useMemo} from 'react';
import {Button} from 'components/Primitives/Button';
import {parseUnits} from '@builtbymom/web3/utils';
import {getTokenAmount} from '@utils/tools.revoke';

import {useGetTokenInfo} from './useGetTokenInfo';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TAllowance} from '@utils/types/revokeType';
import type {TTokenAllowance} from './useAllowances';

type TAllowanceRowProps = {
	allowance: TAllowance;
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowanceRow = ({allowance, revoke}: TAllowanceRowProps): ReactElement => {
	const {args, transactionHash} = allowance;
	const {tokenDecimals, tokenSymbol} = useGetTokenInfo(allowance.address);

	const allowanceAmount = useMemo(() => {
		if (allowance.args.value > parseUnits('115', 74)) {
			return 'unlimited';
		}
		return getTokenAmount(tokenDecimals, allowance.args.value);
	}, [tokenDecimals, allowance]);

	return (
		<tr
			className={
				'odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 dark:bg-gray-800 dark:border-gray-700 border-b odd:bg-white'
			}
			key={transactionHash}>
			<td className={'max-w-56 px-6 py-3'}>
				<p className={'truncate'}>{args.sender}</p>
			</td>
			<td className={'px-6 py-3'}>{tokenSymbol}</td>
			<td className={'max-w-md truncate px-6 py-3'}>{allowanceAmount}</td>
			<td className={'max-w-8 p-3'}>
				<Button
					onClick={() => revoke({address: allowance.address, name: tokenSymbol ?? ''}, allowance.args.sender)}
					className={'!h-8'}>
					{'Revoke'}
				</Button>
			</td>
		</tr>
	);
};
