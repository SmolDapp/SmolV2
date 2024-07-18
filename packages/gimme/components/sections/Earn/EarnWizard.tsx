import {useCallback, useMemo, useState} from 'react';
import {useSolver} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {isAddressEqual} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@gimmeDesignSystem/SuccessModal';
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
	const {onRefresh, getBalance} = useWallet();
	const {address, openLoginModal} = useWeb3();
	const {configuration, onResetEarn} = useEarnFlow();
	const {vaults, vaultsArray} = useVaults();
	const chain = useCurrentChain();

	const [transactionResult, set_transactionResult] = useState<{isExecuted: boolean; message: ReactElement | null}>({
		isExecuted: false,
		message: null
	});

	/**********************************************************************************************
	 ** Based on the user action, we can display a different message in the success modal.
	 *********************************************************************************************/
	const getModalMessage = useCallback(
		(kind: 'DEPOSIT' | 'WITHDRAW'): ReactElement => {
			const vaultName = vaultsArray.find(vault =>
				isAddressEqual(vault.address, toAddress(configuration.asset.token?.address))
			)?.name;

			if (kind === 'WITHDRAW') {
				return (
					<span className={'text-pretty'}>
						{'Successfully withdrawn '}
						<span className={'text-grey-800'}>
							{configuration.asset.normalizedBigAmount.display} {configuration.asset.token?.symbol}
						</span>
						{' from '}
						{configuration.opportunity?.name ?? vaultName}
					</span>
				);
			}
			return (
				<span>
					{'Successfully deposited '}
					<span className={'text-grey-800'}>
						{configuration.asset.normalizedBigAmount.display} {configuration.asset.token?.symbol}
					</span>
					{' to '}
					{configuration.opportunity?.name ?? vaultName}
				</span>
			);
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

			const currentChainID = configuration.opportunity?.chainID || configuration.asset.token?.chainID || chain.id;
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
		[configuration.asset.token, configuration.opportunity, getModalMessage, onRefresh, chain.id, vaults]
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
	} = useSolver();

	const {isZapNeededForDeposit, isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const isAboveBalance =
		configuration.asset.normalizedBigAmount.raw >
		getBalance({
			address: toAddress(configuration.asset.token?.address),
			chainID: Number(configuration.asset.token?.chainID)
		}).raw;

	const isWithdrawing =
		configuration.asset.token && !!vaults[configuration.asset.token?.address] && !configuration.opportunity;

	/**********************************************************************************************
	 ** Once the transaction is done, we can close the modal and reset the state of the wizard.
	 *********************************************************************************************/
	const onCloseModal = useCallback(() => {
		set_transactionResult({isExecuted: false, message: null});
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
		if (isAboveBalance) {
			return false;
		}
		if ((isZapNeededForDeposit || isZapNeededForWithdraw) && !quote) {
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
		isAboveBalance,
		isWithdrawing,
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		quote
	]);

	const getButtonTitle = (): string => {
		if (isWithdrawing) {
			return 'Withdraw';
		}

		if (!configuration.asset.token || !configuration.opportunity) {
			return 'Select Token or Opportunity';
		}

		if (isApproved) {
			return 'Deposit';
		}

		return 'Approve';
	};

	return (
		<div className={'col-span-12'}>
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
					className={'disabled:!bg-grey-100 w-full !font-bold disabled:!opacity-100'}>
					{getButtonTitle()}
				</Button>
			) : (
				<Button
					className={'w-full !rounded-2xl !font-bold'}
					onClick={openLoginModal}>
					{'Connect Wallet'}
				</Button>
			)}

			<SuccessModal
				title={'Success!'}
				content={transactionResult.message}
				ctaLabel={'Ok'}
				isOpen={transactionResult.isExecuted}
				className={'!bg-white shadow-lg'}
				onClose={onCloseModal}
			/>
		</div>
	);
}
