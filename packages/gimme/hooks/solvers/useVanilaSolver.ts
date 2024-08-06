import {useCallback, useState} from 'react';
import toast from 'react-hot-toast';
import {erc20Abi} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, isEthAddress, toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {TransactionStatus} from '@gnosis.pm/safe-apps-sdk';
import {readContract} from '@wagmi/core';
import {deposit} from '@lib/utils/actions';
import {getApproveTransaction, getDepositTransaction} from '@lib/utils/tools.gnosis';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {BaseError} from 'viem';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';

export const useVanilaSolver = (
	inputAsset: TTokenAmountInputElement,
	outputTokenAddress: TAddress | undefined,
	isZapNeeded: boolean
): TSolverContextBase => {
	const {provider, address} = useWeb3();
	const {sdk} = useSafeAppsSDK();
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const isAboveAllowance = allowance.raw >= inputAsset.normalizedBigAmount.raw;

	const shouldDisableFetches = !inputAsset.amount || !outputTokenAddress || !inputAsset.token || isZapNeeded;

	/**********************************************************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(async (): Promise<TNormalizedBN> => {
		if (!inputAsset.token || !outputTokenAddress || !provider || isEthAddress(inputAsset.token.address)) {
			return zeroNormalizedBN;
		}

		set_isFetchingAllowance(true);
		const allowance = await readContract(retrieveConfig(), {
			chainId: Number(inputAsset.token.chainID),
			abi: erc20Abi,
			address: toAddress(inputAsset.token.address),
			functionName: 'allowance',
			args: [toAddress(address), toAddress(outputTokenAddress)]
		});

		set_isFetchingAllowance(false);

		return toNormalizedBN(allowance, inputAsset.token.decimals);
	}, [address, inputAsset.token, outputTokenAddress, provider]);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (shouldDisableFetches) {
			return;
		}
		set_allowance(await onRetrieveAllowance());
	}, [shouldDisableFetches, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(inputAsset.token, 'Input token is not set');
			assert(outputTokenAddress, 'Output token is not set');

			const result = await approveERC20({
				connector: provider,
				chainID: inputAsset.token.chainID,
				contractAddress: inputAsset.token.address,
				spenderAddress: outputTokenAddress,
				amount: inputAsset.normalizedBigAmount?.raw || 0n,
				statusHandler: set_approvalStatus
			});
			set_allowance(await onRetrieveAllowance());
			if (result.isSuccessful) {
				onSuccess?.();
			}
		},
		[inputAsset.token, inputAsset.normalizedBigAmount?.raw, outputTokenAddress, provider, onRetrieveAllowance]
	);

	const onExecuteForGnosis = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			const approveTransactionForBatch = getApproveTransaction(
				toBigInt(inputAsset.normalizedBigAmount?.raw).toString(),
				toAddress(inputAsset.token?.address),
				toAddress(outputTokenAddress)
			);

			const depositTransactionForBatch = getDepositTransaction(
				toAddress(outputTokenAddress),
				toBigInt(inputAsset.normalizedBigAmount?.raw).toString(),
				toAddress(address)
			);

			set_depositStatus({...defaultTxStatus, pending: true});

			try {
				const res = await sdk.txs.send({txs: [approveTransactionForBatch, depositTransactionForBatch]});
				let result;
				do {
					if (
						result?.txStatus === TransactionStatus.CANCELLED ||
						result?.txStatus === TransactionStatus.FAILED
					) {
						throw new Error('An error occured while creating your transaction!');
					}

					result = await sdk.txs.getBySafeTxHash(res.safeTxHash);
					await new Promise(resolve => setTimeout(resolve, 30_000));
				} while (result.txStatus !== TransactionStatus.SUCCESS);

				set_depositStatus({...defaultTxStatus, success: true});
				onSuccess?.();
			} catch (error) {
				set_depositStatus({...defaultTxStatus, error: true});
				toast.error((error as BaseError)?.message || 'An error occured while creating your transaction!');
			}
		},
		[address, inputAsset.normalizedBigAmount?.raw, inputAsset.token?.address, outputTokenAddress, sdk.txs]
	);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(outputTokenAddress, 'Output token is not set');
			assert(inputAsset.token?.address, 'Input amount is not set');
			set_depositStatus({...defaultTxStatus, pending: true});

			const result = await deposit({
				connector: provider,
				chainID: inputAsset.token.chainID,
				contractAddress: toAddress(outputTokenAddress),
				amount: toBigInt(inputAsset.normalizedBigAmount.raw),
				statusHandler: set_depositStatus
			});

			onRetrieveAllowance();
			if (result.isSuccessful) {
				onSuccess();
				set_depositStatus({...defaultTxStatus, success: true});
				return;
			}
			set_depositStatus({...defaultTxStatus, error: true});
		},
		[
			inputAsset.normalizedBigAmount.raw,
			inputAsset.token?.address,
			inputAsset.token?.chainID,
			onRetrieveAllowance,
			outputTokenAddress,
			provider
		]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

		onExecuteForGnosis,

		/** Approval part */
		approvalStatus,
		allowance,
		isFetchingAllowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove,

		isFetchingQuote: false,
		quote: null
	};
};
