import {useCallback, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {assert, toAddress} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';

import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';

export type TWithdrawSolverHelper = {
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
};

/**************************************************************************************************
 * As long as Withdraw logic is shared between every solver, it makes sense to keep it
 * outside of solver hooks and reuse
 *************************************************************************************************/
export const useWithdraw = (): TWithdrawSolverHelper => {
	const {configuration} = useEarnFlow();
	const {vaultsArray} = useVaults();

	const {provider} = useWeb3();

	const [withdrawStatus, set_withdrawStatus] = useState<TTxStatus>(defaultTxStatus);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration.asset.token, 'Output token is not set');
			assert(configuration.asset.amount, 'Input amount is not set');
			const vault = vaultsArray.find(vault =>
				isAddressEqual(vault.address, toAddress(configuration.asset.token?.address))
			);
			if (!vault) {
				throw new Error('Vault not found');
			}
			const isV3 = vault.version.split('.')?.[0] === '3';

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: configuration.asset.token.address,
					amount: configuration.asset.normalizedBigAmount.raw,
					maxLoss: 1n
				});
			} else {
				result = await withdrawShares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: configuration.asset.token.address,
					amount: configuration.asset.normalizedBigAmount.raw
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
			configuration.asset.amount,
			configuration.asset.normalizedBigAmount.raw,
			configuration.asset.token,
			provider,
			vaultsArray
		]
	);

	return {
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw
	};
};
