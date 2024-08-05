import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {useWithdrawSolver} from 'packages/gimme/contexts/useWithdrawSolver';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@gimmeDesignSystem/SuccessModal';
import {Button} from '@lib/primitives/Button';
import {VAULT_V3_ABI} from '@lib/utils/abi/vaultV3.abi';

import {useWithdrawFlow} from './useWithdrawFlow';

export function WithdrawWizard(props: {onClose: () => void}): ReactElement {
	const {configuration, onResetWithdraw} = useWithdrawFlow();
	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.tokenToReceive?.address);
	const {getBalance, onRefresh} = useWallet();

	const {
		onExecuteWithdraw,
		onExecuteDeposit: onExecutePortalsWithdraw,
		isApproved,
		isFetchingAllowance,
		onApprove,
		approvalStatus,
		depositStatus: portalsWithdrawStatus,
		quote,
		withdrawStatus,
		isFetchingAssetShares
	} = useWithdrawSolver();
	const chain = useCurrentChain();

	const [transactionResult, set_transactionResult] = useState<{isExecuted: boolean; message: ReactElement | null}>({
		isExecuted: false,
		message: null
	});

	/**********************************************************************************************
	 ** Once the transaction is done, we can close the modal and reset the state of the wizard.
	 *********************************************************************************************/
	const onCloseModal = useCallback(() => {
		set_transactionResult({isExecuted: false, message: null});
		onResetWithdraw();
		props.onClose();
	}, [onResetWithdraw, props]);

	const sharesBalance = getBalance({
		address: toAddress(configuration.vault?.address),
		chainID: Number(configuration.vault?.chainID)
	}).raw;

	const {data: assetBalance = 0n, isLoading: isFetchingAssetBalance} = useReadContract({
		abi: VAULT_V3_ABI,
		functionName: 'convertToAssets',
		args: [sharesBalance],
		address: toAddress(configuration.vault?.address),
		query: {
			enabled: !!sharesBalance
		}
	});

	const getModalMessage = useCallback(() => {
		return (
			<span className={'text-pretty'}>
				{'Successfully withdrawn '}
				<span className={'text-grey-800'}>
					{configuration.asset.normalizedBigAmount.display} {configuration.asset.token?.symbol}
				</span>
				{' from '}
				{configuration.vault?.name}
			</span>
		);
	}, [configuration.asset.normalizedBigAmount.display, configuration.asset.token?.symbol, configuration.vault?.name]);
	/**********************************************************************************************
	 ** After a successful transaction, this function can be called to refresh balances of the
	 ** tokens involved in the transaction (vault, asset, chain coin).
	 *********************************************************************************************/
	const onRefreshTokens = useCallback(
		(kind: 'APPROVE' | 'WITHDRAW') => {
			if (kind !== 'APPROVE') {
				set_transactionResult({
					isExecuted: true,
					message: getModalMessage()
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

				configuration.vault &&
					tokensToRefresh.push({...configuration.vault.token, chainID: configuration.asset.token.chainID});
			}
			if (configuration.tokenToReceive) {
				tokensToRefresh.push({
					decimals: configuration.tokenToReceive.decimals,
					name: configuration.tokenToReceive.name,
					symbol: configuration.tokenToReceive.symbol,
					address: toAddress(configuration.tokenToReceive.address),
					chainID: Number(configuration.tokenToReceive.chainID)
				});
			}

			const currentChainID =
				configuration.tokenToReceive?.chainID || configuration.asset.token?.chainID || chain.id;
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
		[
			configuration.asset.token,
			configuration.tokenToReceive,
			configuration.vault,
			chain.id,
			onRefresh,
			getModalMessage
		]
	);

	const onAction = useCallback(async () => {
		if (!isZapNeeded) {
			return onExecuteWithdraw(() => onRefreshTokens('WITHDRAW'));
		}
		if (!isApproved) {
			return onApprove(() => onRefreshTokens('APPROVE'));
		}
		return onExecutePortalsWithdraw(() => onRefreshTokens('WITHDRAW'));
	}, [isApproved, isZapNeeded, onApprove, onExecutePortalsWithdraw, onExecuteWithdraw, onRefreshTokens]);

	const isAboveBalance = configuration.asset.normalizedBigAmount.raw > assetBalance;

	const isBusy = useMemo(() => {
		return (
			withdrawStatus.pending ||
			isFetchingAssetBalance ||
			isFetchingAllowance ||
			portalsWithdrawStatus.pending ||
			approvalStatus.pending ||
			isFetchingAssetShares
		);
	}, [
		approvalStatus.pending,
		isFetchingAllowance,
		isFetchingAssetBalance,
		isFetchingAssetShares,
		portalsWithdrawStatus.pending,
		withdrawStatus.pending
	]);

	const isValid = useMemo((): boolean => {
		if (isAboveBalance) {
			return false;
		}
		if (isZapNeeded && !quote) {
			return false;
		}
		if (!configuration.asset.amount || !configuration.asset.token) {
			return false;
		}

		return true;
	}, [configuration.asset.amount, configuration.asset.token, isAboveBalance, isZapNeeded, quote]);

	const getButtonTitle = useCallback(() => {
		if (!configuration.asset.token) {
			return 'Select Token to Withdraw';
		}

		if (!configuration.tokenToReceive) {
			return 'Select Token to Receive';
		}

		if (!isZapNeeded) {
			return 'Withdraw';
		}

		if (isApproved) {
			return 'Withdraw';
		}

		return 'Approve';
	}, [configuration.asset.token, configuration.tokenToReceive, isApproved, isZapNeeded]);

	return (
		<>
			<Button
				isBusy={isBusy}
				isDisabled={!isValid || isBusy}
				onClick={onAction}
				className={
					'disabled:!bg-grey-100 disabled:!text-grey-800 w-full !rounded-2xl !font-bold disabled:!opacity-100'
				}>
				{isBusy ? null : getButtonTitle()}
			</Button>
			<SuccessModal
				title={'Success!'}
				content={transactionResult.message}
				ctaLabel={'Ok'}
				isOpen={transactionResult.isExecuted}
				className={'!bg-white'}
				onClose={onCloseModal}
			/>
		</>
	);
}
