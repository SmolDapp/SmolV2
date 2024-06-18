import {useCallback, useMemo, useRef, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	assert,
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	isZeroAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {allowanceOf, approveERC20, getNetwork} from '@builtbymom/web3/utils/wagmi';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi/transaction';
import {SuccessModal} from '@lib/common/SuccessModal';
import {Button} from '@lib/primitives/Button';
import {approveViaRouter, deposit, depositViaRouter, redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import {useEarnFlow} from './useEarnFlow';

import type {ReactElement} from 'react';
import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi/transaction';

type TApprovalWizardProps = {
	onSuccess: () => void;
};

const useApproveDeposit = ({
	onSuccess
}: TApprovalWizardProps): {
	approvalStatus: TTxStatus;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;
	onApprove: (amount: bigint) => Promise<void>;
} => {
	const {provider} = useWeb3();
	const {configuration} = useEarnFlow();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const {address} = useWeb3();
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);

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
	 ** canProceedWithAllowanceFlow checks if the user can proceed with the allowance flow. It will
	 ** check if the current transaction request, input token, and output token are valid. It will
	 ** also check if the input amount is greater than 0 and if the input token is not an ETH token
	 ** or the zero address.
	 ** If all these conditions are met, it will return true meaning we can either retrieve the
	 ** allowance or proceed allowance request.
	 *********************************************************************************************/
	const canProceedWithSolverAllowanceFlow = useMemo((): boolean => {
		if (
			!configuration.quote.data ||
			!configuration.asset.token?.address ||
			!configuration.opportunity?.token.address
		) {
			return false;
		}

		if (toBigInt(configuration.quote.data.action.fromAmount) === 0n) {
			return false;
		}

		const tokenToSpend = configuration.quote.data.action.fromToken.address;
		if (isEthAddress(tokenToSpend) || isZeroAddress(tokenToSpend)) {
			return false;
		}
		return true;
	}, [configuration.asset.token?.address, configuration.opportunity?.token.address, configuration.quote.data]);

	/**********************************************************************************************
	 ** onRetrieveAllowance checks if the user has enough allowance to perform the swap. It will
	 ** check the allowance of the input token to the contract that will perform the swap, contract
	 ** which is provided by the Portals API.
	 *********************************************************************************************/
	const onRetrieveSolverAllowance = useCallback(async (): Promise<TNormalizedBN> => {
		if (!configuration.quote.data || !canProceedWithSolverAllowanceFlow) {
			return zeroNormalizedBN;
		}
		set_isFetchingAllowance(true);
		const allowance = await allowanceOf({
			connector: provider,
			chainID: configuration.quote.data.action.fromChainId,
			tokenAddress: toAddress(configuration.quote.data.action.fromToken.address),
			spenderAddress: toAddress(configuration.quote.data.estimate.approvalAddress)
		});
		set_isFetchingAllowance(false);

		return toNormalizedBN(allowance, configuration.asset.token?.decimals || 18);
	}, [canProceedWithSolverAllowanceFlow, configuration.asset.token?.decimals, configuration.quote.data, provider]);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		if (configuration.asset.token?.address === configuration.opportunity?.token.address) {
			return set_allowance(await onRetrieveAllowance(true));
		}
		return set_allowance(await onRetrieveSolverAllowance());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address, configuration.asset.token?.address, configuration.asset.token?.address, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(async (): Promise<void> => {
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
	}, [
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token,
		configuration.opportunity,
		onSuccess,
		provider,
		triggerRetreiveAllowance
	]);

	const onApproveSolver = useCallback(async (): Promise<void> => {
		if (!configuration.quote.data || !canProceedWithSolverAllowanceFlow) {
			return;
		}

		const result = await approveERC20({
			connector: provider,
			chainID: configuration.quote.data.action.fromChainId,
			contractAddress: toAddress(configuration.quote.data.action.fromToken.address),
			spenderAddress: toAddress(configuration.quote.data.estimate.approvalAddress),
			amount: toBigInt(configuration.quote.data.action.fromAmount),
			statusHandler: set_approvalStatus,
			shouldDisplaySuccessToast: false
		});
		if (result.isSuccessful) {
			onSuccess();
			triggerRetreiveAllowance();
		}
	}, [canProceedWithSolverAllowanceFlow, configuration.quote.data, onSuccess, provider, triggerRetreiveAllowance]);

	const isAboveAllowance = allowance.raw >= configuration.asset.normalizedBigAmount.raw;

	return {
		approvalStatus,
		allowance,
		isFetchingAllowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove: configuration.quote.data ? onApproveSolver : onApprove
	};
};

const useDeposit = (props: {
	onSuccess: () => void;
}): {
	onExecuteDeposit: () => Promise<void>;
	depositStatus: TTxStatus;
	set_depositStatus: (value: TTxStatus) => void;
} => {
	const {configuration} = useEarnFlow();
	const {provider} = useWeb3();
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(async (): Promise<void> => {
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
					props.onSuccess();
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
			props.onSuccess();
			set_depositStatus({...defaultTxStatus, success: true});
			return;
		}
		set_depositStatus({...defaultTxStatus, error: true});
	}, [
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token?.address,
		configuration.opportunity,
		props,
		provider
	]);

	return {onExecuteDeposit, set_depositStatus, depositStatus};
};

const useWithdraw = (props: {
	onSuccess: () => void;
}): {
	onExecuteWithdraw: () => Promise<void>;
	withdrawStatus: TTxStatus;
	set_withdrawStatus: (value: TTxStatus) => void;
} => {
	const {configuration} = useEarnFlow();
	const {provider} = useWeb3();
	const {vaultsArray} = useVaults();
	const [withdrawStatus, set_withdrawStatus] = useState(defaultTxStatus);

	/*********************************************************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back some underlying token
	 ** from this specific vault.
	 *********************************************************************************************/
	const onExecuteWithdraw = useCallback(async (): Promise<void> => {
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
			props.onSuccess();
			set_withdrawStatus({...defaultTxStatus, success: true});
			return;
		}
		set_withdrawStatus({...defaultTxStatus, error: true});
	}, [
		configuration.asset.amount,
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token,
		props,
		provider,
		vaultsArray
	]);

	return {onExecuteWithdraw, set_withdrawStatus, withdrawStatus};
};

export function EarnWizard(): ReactElement {
	const {onRefresh} = useWallet();
	const {configuration, onResetEarn} = useEarnFlow();
	const {safeChainID} = useChainID();
	const {vaults, vaultsArray} = useVaults();
	const [transactionResult, set_transactionResult] = useState({
		isExecuted: false,
		message: ''
	});

	/**********************************************************************************************
	 ** Based on the user action, we can display a different message in the success modal.
	 *********************************************************************************************/
	const getModalMessage = useCallback(
		(kind: 'DEPOSIT' | 'WITHDRAW'): string => {
			const vaultName = vaultsArray.find(vault =>
				isAddressEqual(vault.address, toAddress(configuration.asset.token?.address))
			)?.name;

			if (kind === 'WITHDRAW') {
				return `Successfully withdrawn ${configuration.asset.normalizedBigAmount.display} ${configuration.asset.token?.symbol} from ${configuration.opportunity?.name ?? vaultName}`;
			}
			return `Successfully deposited ${configuration.asset.normalizedBigAmount.display} ${configuration.asset.token?.symbol} to ${configuration.opportunity?.name ?? vaultName}`;
		},
		[
			configuration.asset.normalizedBigAmount.display,
			configuration.asset.token?.address,
			configuration.asset.token?.symbol,
			configuration.opportunity?.name,
			vaultsArray
		]
	);

	/**********************************************************************************************
	 ** After a successful transaction, this function can be called to refresh balances of the
	 ** tokens involved in the transaction (vault, asset, chain coin).
	 *********************************************************************************************/
	const onRefreshTokens = useCallback(
		(kind: 'APPROVE' | 'DEPOSIT' | 'WITHDRAW') => {
			if (kind !== 'APPROVE') {
				set_transactionResult({
					isExecuted: true,
					message: getModalMessage(kind as 'DEPOSIT' | 'WITHDRAW')
				});
			}
			const tokensToRefresh = [];
			if (configuration.asset.token) {
				tokensToRefresh.push({
					decimals: configuration.asset.token.decimals,
					name: configuration.asset.token.name,
					symbol: configuration.asset.token.symbol,
					address: toAddress(configuration.asset.token.address),
					chainID: Number(configuration.asset.token.chainID)
				});
			}
			if (configuration.opportunity) {
				tokensToRefresh.push({
					decimals: configuration.opportunity.decimals,
					name: configuration.opportunity.name,
					symbol: configuration.opportunity.symbol,
					address: toAddress(configuration.opportunity.address),
					chainID: Number(configuration.opportunity.chainID)
				});
			}

			/**************************************************************************************
			 * It's important to refetch the token linked to the vault user been withdrawing from
			 *************************************************************************************/
			if (kind === 'WITHDRAW' && configuration.asset.token) {
				const vaultToken = vaults[configuration.asset.token?.address].token ?? null;
				tokensToRefresh.push({...vaultToken, chainID: vaults[configuration.asset.token?.address].chainID});
			}

			const currentChainID =
				configuration.opportunity?.chainID || configuration.asset.token?.chainID || safeChainID;
			const {nativeCurrency} = getNetwork(Number(currentChainID));
			if (nativeCurrency) {
				tokensToRefresh.push({
					decimals: 18,
					name: nativeCurrency.name,
					symbol: nativeCurrency.symbol,
					address: ETH_TOKEN_ADDRESS,
					chainID: Number(currentChainID)
				});
			}
			onRefresh(tokensToRefresh, false, true);
		},
		[configuration.asset.token, configuration.opportunity, getModalMessage, onRefresh, safeChainID, vaults]
	);

	const {onApprove, isApproved, isFetchingAllowance, approvalStatus} = useApproveDeposit({
		onSuccess: () => onRefreshTokens('APPROVE')
	});
	const {onExecuteDeposit, depositStatus} = useDeposit({onSuccess: () => onRefreshTokens('DEPOSIT')});
	const {onExecuteWithdraw, withdrawStatus} = useWithdraw({onSuccess: () => onRefreshTokens('WITHDRAW')});

	const isWithdrawing = configuration.asset.token ? !!vaults[configuration.asset.token?.address] : false;

	/**********************************************************************************************
	 ** Once the transaction is done, we can close the modal and reset the state of the wizard.
	 *********************************************************************************************/
	const onCloseModal = useCallback(() => {
		set_transactionResult({isExecuted: false, message: ''});
		onResetEarn();
	}, [onResetEarn]);

	const onAction = useCallback(async () => {
		if (isWithdrawing) {
			return onExecuteWithdraw();
		}
		if (isApproved) {
			return onExecuteDeposit();
		}
		return onApprove(configuration.asset.normalizedBigAmount.raw);
	}, [
		configuration.asset.normalizedBigAmount.raw,
		isApproved,
		isWithdrawing,
		onApprove,
		onExecuteDeposit,
		onExecuteWithdraw
	]);

	const isValid = useMemo((): boolean => {
		// TODO: probably move to util this check
		const isZapNeeded =
			configuration.asset.token?.address &&
			configuration.opportunity?.address &&
			configuration.asset.token.address !== configuration.opportunity.token.address;

		if (isZapNeeded && !configuration.quote.data) {
			return false;
		}
		if (!configuration.asset.amount || !configuration.asset.token) {
			return false;
		}
		if (!isWithdrawing && !configuration.opportunity) {
			return false;
		}

		return true;
	}, [
		configuration.asset.amount,
		configuration.asset.token,
		configuration.opportunity,
		configuration.quote.data,
		isWithdrawing
	]);

	const getButtonTitle = (): string => {
		if (isWithdrawing) {
			return 'Withdraw';
		}
		if (isApproved) {
			return 'Deposit';
		}
		return 'Approve';
	};

	return (
		<div className={'col-span-12 mt-6'}>
			<Button
				isBusy={
					depositStatus.pending ||
					withdrawStatus.pending ||
					approvalStatus.pending ||
					isFetchingAllowance ||
					configuration.quote.isLoading
				}
				isDisabled={!isValid}
				onClick={onAction}
				className={'w-full'}>
				<b>{getButtonTitle()}</b>
			</Button>

			<SuccessModal
				title={'It looks like a success!'}
				content={transactionResult.message}
				ctaLabel={isWithdrawing ? 'Deposit' : 'Another deposit'}
				isOpen={transactionResult.isExecuted}
				className={'!bg-white shadow-lg'}
				onClose={onCloseModal}
			/>
		</div>
	);
}
