import {type ReactElement, useCallback, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useBalancesCurtain} from '@smolContexts/useBalancesCurtain';
import {IconPlus} from '@lib/icons/IconPlus';
import {Button} from '@lib/primitives/Button';
import {isDev} from '@lib/utils/constants';

import {AllowancesFilters} from './AllowancesFilters';
import {AllowancesTable} from './AllowancesTable';
import {useAllowances} from './useAllowances';
import {RevokeWizard} from './Wizard';

import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAllowance} from '@lib/types/Revoke';

export function Revoke(): ReactElement {
	const {chainID, safeChainID} = useChainID();
	const [revokeStatus, set_revokeStatus] = useState(defaultTxStatus);
	const {onOpenCurtain} = useBalancesCurtain();

	const {provider} = useWeb3();
	const {dispatchConfiguration, allowances} = useAllowances();
	const revokeTokenAllowance = useCallback(
		(tokenToRevoke: TTokenAllowance, spender: TAddress): void => {
			dispatchConfiguration({type: 'SET_TOKEN_TO_REVOKE', payload: {...tokenToRevoke, spender}});
			if (!tokenToRevoke) {
				return;
			}
			approveERC20({
				contractAddress: tokenToRevoke.address,
				chainID: isDev ? chainID : safeChainID,
				connector: provider,
				spenderAddress: spender,
				amount: 0n,
				statusHandler: set_revokeStatus
			}).then(result => {
				if (result.isSuccessful) {
					set_revokeStatus({...defaultTxStatus, success: true});
				}
			});
		},
		[chainID, dispatchConfiguration, provider, safeChainID]
	);
	return (
		<div className={'w-full'}>
			{allowances?.length ? (
				<Button
					className={'!h-10'}
					onClick={() =>
						onOpenCurtain(selected =>
							dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: selected})
						)
					}>
					<IconPlus className={'mr-2 size-3'} />
					{'Add token'}
				</Button>
			) : null}
			{allowances?.length ? <AllowancesFilters /> : null}
			<AllowancesTable revoke={revokeTokenAllowance} />
			<RevokeWizard
				revokeStatus={revokeStatus}
				set_revokeStatus={set_revokeStatus}
			/>
		</div>
	);
}
