import {useCallback, useRef, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {allowanceOf, approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {deposit} from '@lib/utils/actions';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import {useIsZapNeeded} from '../helpers/useIsZapNeeded';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';

export const useVanilaSolver = (): TSolverContextBase => {
	const {configuration} = useEarnFlow();
	const {provider, address} = useWeb3();
	const isZapNeeded = useIsZapNeeded();

	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);

	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const isAboveAllowance = allowance.raw >= configuration.asset.normalizedBigAmount.raw;

	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);

	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

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
				configuration.asset.token.address === ETH_TOKEN_ADDRESS
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

			const allowance = await allowanceOf({
				connector: provider,
				chainID: configuration.opportunity.chainID,
				tokenAddress: toAddress(configuration.asset.token.address),
				spenderAddress: toAddress(configuration.opportunity.address)
			});
			set_isFetchingAllowance(false);
			existingAllowances.current[key] = toNormalizedBN(allowance, configuration.asset.token.decimals);
			return existingAllowances.current[key];
		},
		[configuration.asset.token, configuration.opportunity, provider, address]
	);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		/******************************************************************************************
		 * Skip allowance fetching if form is not populated fully or zap needed
		 *****************************************************************************************/
		if (isZapNeeded) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [isZapNeeded, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration.asset.token, 'Input token is not set');
			assert(configuration.opportunity, 'Output token is not set');

			const result = await approveERC20({
				connector: provider,
				chainID: configuration.opportunity.chainID,
				contractAddress: configuration.asset.token.address,
				spenderAddress: configuration.opportunity.address,
				amount: configuration.asset.normalizedBigAmount.raw,
				statusHandler: set_approvalStatus
			});
			if (result.isSuccessful) {
				onSuccess();
				triggerRetreiveAllowance();
			}
		},
		[
			configuration.asset.normalizedBigAmount.raw,
			configuration.asset.token,
			configuration.opportunity,
			provider,
			triggerRetreiveAllowance
		]
	);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration.opportunity?.address, 'Output token is not set');
			assert(configuration.asset.token?.address, 'Input amount is not set');

			set_depositStatus({...defaultTxStatus, pending: true});

			const result = await deposit({
				connector: provider,
				chainID: configuration.opportunity.chainID,
				contractAddress: configuration.opportunity?.address,
				amount: configuration.asset.normalizedBigAmount.raw
			});
			if (result.isSuccessful) {
				onSuccess();
				set_depositStatus({...defaultTxStatus, success: true});
				return;
			}
			set_depositStatus({...defaultTxStatus, error: true});
		},
		[
			configuration.asset.normalizedBigAmount.raw,
			configuration.asset.token?.address,
			configuration.opportunity,
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
