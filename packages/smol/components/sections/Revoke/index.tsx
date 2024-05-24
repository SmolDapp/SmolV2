import {type ReactElement, useCallback, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {IconPlus} from '@lib/icons/IconPlus';
import {Button} from '@lib/primitives/Button';
import {isDev} from '@lib/utils/tools.chains';

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

	/**********************************************************************************************
	 ** This function calls approve contract and sets 0 for approve amount. Simply it revokes the
	 ** allowance.
	 *********************************************************************************************/
	const revokeTokenAllowance = useCallback(
		async (tokenToRevoke: TTokenAllowance, spender: TAddress): Promise<void> => {
			if (!tokenToRevoke) {
				return;
			}
			dispatchConfiguration({type: 'SET_ALLOWANCE_TO_REVOKE', payload: {...tokenToRevoke, spender}});
			await approveERC20({
				contractAddress: tokenToRevoke.address,
				chainID: isDev ? chainID : safeChainID,
				connector: provider,
				spenderAddress: spender,
				amount: 0n,
				statusHandler: set_revokeStatus
			});
		},
		[chainID, dispatchConfiguration, provider, safeChainID]
	);

	/**********************************************************************************************
	 ** This function opens curtain to choose extra tokens to check.
	 *********************************************************************************************/
	const handleOpenCurtain = (): void => {
		onOpenCurtain(selected => dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: selected}));
	};

	return (
		<div className={'w-full'}>
			{allowances?.length ? (
				<Button
					className={'!h-10'}
					onClick={handleOpenCurtain}>
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
