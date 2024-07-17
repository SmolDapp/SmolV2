import {useCallback, useRef, useState} from 'react';
import {erc20Abi} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {readContract} from '@wagmi/core';
import {deposit} from '@lib/utils/actions';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';

export const useVanilaSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean,
	isBridgeNeededForDeposit: boolean,
	isBridgeNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useEarnFlow();
	const {provider, address} = useWeb3();
	const {onRefresh} = useWallet();
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const existingAllowances = useRef<TDict<TNormalizedBN>>({});
	const isAboveAllowance = allowance.raw >= configuration.asset.normalizedBigAmount.raw;

	/**********************************************************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (
				!configuration.asset.token ||
				!configuration.opportunity ||
				!provider ||
				isEthAddress(configuration.asset.token.address)
			) {
				return zeroNormalizedBN;
			}

			const key = allowanceKey(
				configuration.opportunity.chainID,
				toAddress(configuration.asset.token.address),
				toAddress(configuration.opportunity.address),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			set_isFetchingAllowance(true);
			const allowance = await readContract(retrieveConfig(), {
				chainId: Number(configuration?.opportunity.chainID),
				abi: erc20Abi,
				address: toAddress(configuration?.asset?.token.address),
				functionName: 'allowance',
				args: [toAddress(address), toAddress(configuration?.opportunity.address)]
			});

			set_isFetchingAllowance(false);

			existingAllowances.current[key] = toNormalizedBN(allowance, configuration?.asset?.token.decimals);
			return existingAllowances.current[key];
		},
		[address, configuration?.asset.token, configuration?.opportunity, provider]
	);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isZapNeededForWithdraw) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && isBridgeNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isBridgeNeededForWithdraw) {
			return;
		}
		set_allowance(await onRetrieveAllowance(false));
	}, [
		configuration.action,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw,
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		onRetrieveAllowance
	]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(configuration?.asset.token, 'Input token is not set');
			assert(configuration?.opportunity, 'Output token is not set');

			const result = await approveERC20({
				connector: provider,
				chainID: configuration?.opportunity.chainID,
				contractAddress: configuration?.asset.token.address,
				spenderAddress: configuration?.opportunity.address,
				amount: configuration?.asset.normalizedBigAmount?.raw || 0n,
				statusHandler: set_approvalStatus
			});
			set_allowance(await onRetrieveAllowance(true));
			if (result.isSuccessful) {
				onSuccess?.();
			}
		},
		[
			configuration?.asset.normalizedBigAmount?.raw,
			configuration?.asset.token,
			configuration?.opportunity,
			provider,
			onRetrieveAllowance
		]
	);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration?.opportunity?.address, 'Output token is not set');
			assert(configuration?.asset?.token?.address, 'Input amount is not set');
			set_depositStatus({...defaultTxStatus, pending: true});

			const result = await deposit({
				connector: provider,
				chainID: configuration?.opportunity?.chainID,
				contractAddress: toAddress(configuration?.opportunity?.address),
				amount: toBigInt(configuration?.asset?.normalizedBigAmount?.raw),
				statusHandler: set_depositStatus
			});
			await onRefresh(
				[
					{chainID: configuration?.opportunity?.chainID, address: configuration?.opportunity?.address},
					{chainID: configuration?.opportunity?.chainID, address: configuration?.opportunity?.token?.address},
					{chainID: configuration?.opportunity?.chainID, address: ETH_TOKEN_ADDRESS}
				],
				false,
				true
			);
			onRetrieveAllowance(true);
			if (result.isSuccessful) {
				onSuccess();
				set_depositStatus({...defaultTxStatus, success: true});
				return;
			}
			set_depositStatus({...defaultTxStatus, error: true});
		},
		[
			configuration?.asset?.normalizedBigAmount?.raw,
			configuration?.asset?.token?.address,
			configuration?.opportunity?.address,
			configuration?.opportunity?.chainID,
			configuration?.opportunity?.token?.address,
			onRefresh,
			onRetrieveAllowance,
			provider
		]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

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
