import {useCallback, useRef, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {assert, ETH_TOKEN_ADDRESS, toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {allowanceOf, approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {approveViaRouter, deposit, depositViaRouter, redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

export const useVanilaSolver = (): {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Withdraw part */
	withdrawStatus: TTxStatus;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
	set_withdrawStatus: (value: TTxStatus) => void;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	quote: TPortalsEstimate | null;
} => {
	const {configuration} = useEarnFlow();
	const {provider, address} = useWeb3();
	const {vaultsArray} = useVaults();

	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);

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
			if (!configuration.asset.token || !configuration.opportunity || !provider) {
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
		set_allowance(await onRetrieveAllowance(true));

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address, configuration.asset.token?.address, configuration.asset.token?.address, onRetrieveAllowance]);

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

			/**************************************************************************************
			 ** If we are dealing with the Yearn 4626 Router:
			 ** - The router must be approved to spend the vault token. This actions is required
			 **   only one time, but is required anyway. In our case, this should be part of our
			 **   testing. But just in case, we are adding this check so the user can approve it
			 **   and continue as if it was a normal approve.
			 ** - If the address is ETH_TOKEN_ADDRESS and we have a router, we can proceed,
			 **   otherwise we throw an error, preventing the user to continue.
			 *************************************************************************************/
			if (configuration.asset.token.address === ETH_TOKEN_ADDRESS) {
				if ((configuration.opportunity as {router?: TAddress}).router) {
					const result = await approveViaRouter({
						connector: provider,
						chainID: configuration.opportunity.chainID,
						contractAddress: (configuration.opportunity as {router?: TAddress}).router,
						amount: configuration.asset.normalizedBigAmount.raw,
						vault: configuration.opportunity?.address,
						tokenAddress: configuration.opportunity.token.address,
						statusHandler: set_approvalStatus
					});
					if (result.isSuccessful) {
						onSuccess();
					}
					triggerRetreiveAllowance();
					return;
				}
				throw new Error(`No router for ${configuration.opportunity?.name} vault`);
			}

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

			if (configuration.asset.token.address === ETH_TOKEN_ADDRESS) {
				if ((configuration.opportunity as {router?: TAddress}).router) {
					const result = await depositViaRouter({
						connector: provider,
						chainID: configuration.opportunity.chainID,
						contractAddress: (configuration.opportunity as {router?: TAddress}).router,
						amount: configuration.asset.normalizedBigAmount.raw,
						vault: configuration.opportunity?.address
					});
					if (result.isSuccessful) {
						set_depositStatus({...defaultTxStatus, success: true});
						onSuccess();
						return;
					}
					set_depositStatus({...defaultTxStatus, error: true});
					return;
				}
				throw new Error(`No router for ${configuration.opportunity?.name} vault`);
			}

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

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			console.log('here');
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
		/** Withraw part */
		withdrawStatus,
		set_withdrawStatus,
		onExecuteWithdraw,

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

		quote: null
	};
};
