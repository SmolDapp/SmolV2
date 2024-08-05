import {useCallback, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {assert} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';

import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TWithdrawSolverHelper = {
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
};

/**************************************************************************************************
 * As long as Withdraw logic is shared between every solver, it makes sense to keep it
 * outside of solver hooks and reuse
 *************************************************************************************************/
export const useWithdraw = (
	inputAsset: TTokenAmountInputElement,
	vault: TYDaemonVault | undefined,
	refetchShares: () => Promise<void>,
	sharesInputAmount: bigint
): TWithdrawSolverHelper => {
	const {provider} = useWeb3();

	const [withdrawStatus, set_withdrawStatus] = useState<TTxStatus>(defaultTxStatus);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(inputAsset.token, 'Input token is not set');
			assert(inputAsset.amount, 'Input amount is not set');

			if (!vault) {
				throw new Error('Vault not found');
			}
			refetchShares();

			const isV3 = vault.version.split('.')?.[0] === '3';

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: vault.address,
					amount: sharesInputAmount,
					maxLoss: 1n
				});
			} else {
				result = await withdrawShares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: vault.address,
					amount: inputAsset.normalizedBigAmount.raw
				});
			}

			if (result.isSuccessful) {
				onSuccess();
				set_withdrawStatus({...defaultTxStatus, success: true});
				return;
			}
			set_withdrawStatus({...defaultTxStatus, error: true});
		},
		[
			inputAsset.amount,
			inputAsset.normalizedBigAmount.raw,
			inputAsset.token,
			provider,
			refetchShares,
			sharesInputAmount,
			vault
		]
	);

	return {
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw
	};
};
