import {useMemo} from 'react';
import {Button} from 'packages/lib/primitives/Button';
import {getTokenAmount} from 'packages/lib/utils/tools.revoke';
import {parseUnits} from '@builtbymom/web3/utils';

import {useGetTokenInfo} from './useGetTokenInfo';

import type {TAllowance} from 'packages/lib/utils/types/revokeType';
import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAllowance} from './useAllowances';

type TAllowanceRowProps = {
	allowance: TAllowance;
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowanceRow = ({allowance, revoke}: TAllowanceRowProps): ReactElement => {
	const {args, transactionHash} = allowance;
	const {tokenDecimals, tokenSymbol} = useGetTokenInfo(allowance.address);

	const allowanceAmount = useMemo(() => {
		if ((allowance.args.value as bigint) > parseUnits('115', 74)) {
			return 'unlimited';
		}
		return getTokenAmount(tokenDecimals, allowance.args.value as bigint);
	}, [tokenDecimals, allowance]);

	return (
		<tr
			className={
				'border-b odd:bg-white even:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 odd:dark:bg-gray-900 even:dark:bg-gray-800'
			}
			key={transactionHash}>
			<td className={'max-w-56 px-6 py-3'}>
				<p className={'truncate  text-sm '}>{args.sender}</p>
			</td>
			<td className={'px-6 py-3 text-right'}>{tokenSymbol}</td>
			<td className={'max-w-[120px] truncate px-6 py-3 text-right'}>{allowanceAmount}</td>
			<td className={'max-w-8 p-3'}>
				<Button
					onClick={() => revoke({address: allowance.address, name: tokenSymbol ?? ''}, allowance.args.sender)}
					className={'!h-8 font-bold'}>
					<p className={'text-xs font-bold leading-6'}>{'Revoke'}</p>
				</Button>
			</td>
		</tr>
	);
};
