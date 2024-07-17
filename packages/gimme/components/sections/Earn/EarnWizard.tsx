import {useCallback, useMemo, useState} from 'react';
import {useSolver} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useIsBridgeNeeded} from 'packages/gimme/hooks/helpers/useIsBridgeNeeded';
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

export function EarnWizard(): ReactElement {
	const {onRefresh, getBalance} = useWallet();
	const {address, openLoginModal} = useWeb3();
	const {configuration, onResetEarn} = useEarnFlow();
	const {vaults, vaultsArray} = useVaults();
	const chain = useCurrentChain();

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
	const {isBridgeNeededForDeposit, isBridgeNeededForWithdraw} = useIsBridgeNeeded(configuration);

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
		if (isAboveBalance) {
			return false;
		}
		if ((isZapNeededForDeposit || isZapNeededForWithdraw) && !quote) {
			return false;
		}
		if ((isBridgeNeededForDeposit || isBridgeNeededForWithdraw) && !quote) {
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
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw,
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
					className={'disabled:!bg-grey-100 w-full disabled:!opacity-100'}>
					{getButtonTitle()}
				</Button>
			) : (
				<Button
					className={'w-full !rounded-2xl'}
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
