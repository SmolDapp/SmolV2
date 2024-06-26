import {useCallback, useMemo, useState} from 'react';
import {useSolvers} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {isAddressEqual} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@lib/common/SuccessModal';
import {Button} from '@lib/primitives/Button';

import {useEarnFlow} from './useEarnFlow';

import type {ReactElement} from 'react';

/**********************************************************************************************
 ** canProceedWithAllowanceFlow checks if the user can proceed with the allowance flow. It will
 ** check if the current transaction request, input token, and output token are valid. It will
 ** also check if the input amount is greater than 0 and if the input token is not an ETH token
 ** or the zero address.
 ** If all these conditions are met, it will return true meaning we can either retrieve the
 ** allowance or proceed allowance request.
 *********************************************************************************************/
// const canProceedWithSolverAllowanceFlow = useMemo((): boolean => {
// 	if (
// 		!configuration.quote.data ||
// 		!configuration.asset.token?.address ||
// 		!configuration.opportunity?.token.address
// 	) {
// 		return false;
// 	}

// 	if (toBigInt(configuration.quote.data.action.fromAmount) === 0n) {
// 		return false;
// 	}

// 	const tokenToSpend = configuration.quote.data.action.fromToken.address;
// 	if (isEthAddress(tokenToSpend) || isZeroAddress(tokenToSpend)) {
// 		return false;
// 	}
// 	return true;
// }, [configuration.asset.token?.address, configuration.opportunity?.token.address, configuration.quote.data]);

/**********************************************************************************************
 ** onRetrieveAllowance checks if the user has enough allowance to perform the swap. It will
 ** check the allowance of the input token to the contract that will perform the swap, contract
 ** which is provided by the Portals API.
 *********************************************************************************************/
// const onRetrieveSolverAllowance = useCallback(async (): Promise<TNormalizedBN> => {
// 	if (!configuration.quote.data || !canProceedWithSolverAllowanceFlow) {
// 		return zeroNormalizedBN;
// 	}
// 	set_isFetchingAllowance(true);
// 	const allowance = await allowanceOf({
// 		connector: provider,
// 		chainID: configuration.quote.data.action.fromChainId,
// 		tokenAddress: toAddress(configuration.quote.data.action.fromToken.address),
// 		spenderAddress: toAddress(configuration.quote.data.estimate.approvalAddress)
// 	});
// 	set_isFetchingAllowance(false);

// 	return toNormalizedBN(allowance, configuration.asset.token?.decimals || 18);
// }, [canProceedWithSolverAllowanceFlow, configuration.asset.token?.decimals, configuration.quote.data, provider]);

// const onApproveSolver = useCallback(async (): Promise<void> => {
// 	if (!configuration.quote.data || !canProceedWithSolverAllowanceFlow) {
// 		return;
// 	}

// 	const result = await approveERC20({
// 		connector: provider,
// 		chainID: configuration.quote.data.action.fromChainId,
// 		contractAddress: toAddress(configuration.quote.data.action.fromToken.address),
// 		spenderAddress: toAddress(configuration.quote.data.estimate.approvalAddress),
// 		amount: toBigInt(configuration.quote.data.action.fromAmount),
// 		statusHandler: set_approvalStatus,
// 		shouldDisplaySuccessToast: false
// 	});
// 	if (result.isSuccessful) {
// 		onSuccess();
// 		triggerRetreiveAllowance();
// 	}
// }, [canProceedWithSolverAllowanceFlow, configuration.quote.data, onSuccess, provider, triggerRetreiveAllowance]);

export function EarnWizard(): ReactElement {
	const {onRefresh} = useWallet();

	const {address, openLoginModal} = useWeb3();

	const {configuration, onResetEarn} = useEarnFlow();
	const {vaults, vaultsArray} = useVaults();

	const {safeChainID} = useChainID();

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

	const {
		onApprove,
		isApproved,
		isFetchingAllowance,
		approvalStatus,

		onExecuteDeposit,
		depositStatus,

		onExecuteWithdraw,
		withdrawStatus,

		isFetchingQuote,
		quote
	} = useSolvers();

	const isZapNeeded = useIsZapNeeded();

	const isWithdrawing =
		configuration.asset.token && !!vaults[configuration.asset.token?.address] && !configuration.opportunity;
	const isMigrating =
		configuration.asset.token && !!vaults[configuration.asset.token?.address] && configuration.opportunity;
	/**********************************************************************************************
	 ** Once the transaction is done, we can close the modal and reset the state of the wizard.
	 *********************************************************************************************/
	const onCloseModal = useCallback(() => {
		set_transactionResult({isExecuted: false, message: ''});
		onResetEarn();
	}, [onResetEarn]);

	const onAction = useCallback(async () => {
		if (isWithdrawing) {
			return onExecuteWithdraw(() => onRefreshTokens('WITHDRAW'));
		}
		if (isApproved) {
			return onExecuteDeposit(() => onRefreshTokens('DEPOSIT'));
		}
		return onApprove(() => onRefreshTokens('APPROVE'));
	}, [isApproved, isWithdrawing, onApprove, onExecuteDeposit, onExecuteWithdraw, onRefreshTokens]);

	const isValid = useMemo((): boolean => {
		if (isZapNeeded && !quote) {
			return false;
		}
		if (!configuration.asset.amount || !configuration.asset.token) {
			return false;
		}
		if (!isWithdrawing && !configuration.opportunity) {
			return false;
		}

		if (configuration.asset.token.address === configuration.opportunity?.address) {
			return false;
		}

		return true;
	}, [
		configuration.asset.amount,
		configuration.asset.token,
		configuration.opportunity,
		isWithdrawing,
		isZapNeeded,
		quote
	]);

	const getButtonTitle = (): string => {
		if (isWithdrawing) {
			return 'Withdraw';
		}
		if (isApproved) {
			if (isMigrating) {
				return 'Migrate';
			}
			return 'Deposit';
		}
		return 'Approve';
	};

	return (
		<div className={'col-span-12 mt-6'}>
			{address ? (
				<Button
					isBusy={
						depositStatus.pending ||
						withdrawStatus.pending ||
						approvalStatus.pending ||
						isFetchingAllowance ||
						isFetchingQuote
					}
					isDisabled={!isValid}
					onClick={onAction}
					className={'w-full'}>
					<b>{getButtonTitle()}</b>
				</Button>
			) : (
				<Button
					className={
						'w-full !border !border-neutral-900 !bg-white transition-colors hover:!border-neutral-600 hover:text-neutral-600'
					}
					onClick={openLoginModal}>
					{'Connect'}
				</Button>
			)}

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
