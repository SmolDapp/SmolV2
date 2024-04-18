import {useMemo} from 'react';
import {Button} from 'components/Primitives/Button';
import {parseUnits} from '@builtbymom/web3/utils';
import {getTokenAmount} from '@utils/tools.revoke';

import {useGetTokenInfo} from './useGetTokenInfo';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TAllowance} from '@utils/types/revokeType';
import type {TTokenToRevoke} from './Wizard';

type TAllowanceRowProps = {
	allowance: TAllowance;
	revoke: (tokenToRevoke: TTokenToRevoke, spender: TAddress) => void;
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
				'odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:bg-gray-800 dark:border-gray-700'
			}
			key={transactionHash}>
			<td className={'px-6 py-3 max-w-56'}>
				<p className={'truncate'}>{args.sender}</p>
			</td>
			<td className={'px-6 py-3'}>{tokenSymbol}</td>
			<td className={'px-6 py-3 truncate max-w-md'}>{allowanceAmount}</td>
			<td className={'py-3 px-3 max-w-8'}>
				<Button
					onClick={() => revoke({address: allowance.address, name: tokenSymbol ?? ''}, allowance.args.sender)}
					className={'!h-8'}>
					{'Revoke'}
				</Button>
			</td>
		</tr>
	);
};
