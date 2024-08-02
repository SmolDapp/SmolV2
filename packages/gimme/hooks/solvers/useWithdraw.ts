import {useCallback, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {assert, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {readContract} from '@wagmi/core';
import {VAULT_V3_ABI} from '@lib/utils/abi/vaultV3.abi';
import {redeemV3Shares, withdrawShares} from '@lib/utils/actions';

import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TTokenAmountInputElement} from '@lib/types/utils';

export type TWithdrawSolverHelper = {
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
};

/**************************************************************************************************
 * As long as Withdraw logic is shared between every solver, it makes sense to keep it
 * outside of solver hooks and reuse
 *************************************************************************************************/
export const useWithdraw = (inputAsset: TTokenAmountInputElement): TWithdrawSolverHelper => {
	const {vaultsArray} = useVaults();
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

			const vault = vaultsArray.find(vault =>
				isAddressEqual(vault.token.address, toAddress(inputAsset.token?.address))
			);
			if (!vault) {
				throw new Error('Vault not found');
			}

			const sharesAmount = await readContract(retrieveConfig(), {
				chainId: Number(inputAsset.token.chainID),
				abi: VAULT_V3_ABI,
				address: toAddress(vault.address),
				functionName: 'convertToShares',
				args: [toBigInt(inputAsset.normalizedBigAmount.raw)]
			});

			const isV3 = vault.version.split('.')?.[0] === '3';

			set_withdrawStatus({...defaultTxStatus, pending: true});

			let result;
			if (isV3) {
				result = await redeemV3Shares({
					connector: provider,
					chainID: vault.chainID,
					contractAddress: vault.address,
					amount: sharesAmount,
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
		[inputAsset.amount, inputAsset.normalizedBigAmount.raw, inputAsset.token, provider, vaultsArray]
	);

	return {
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw
	};
};
