import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useWithdrawSolver} from 'packages/gimme/contexts/useWithdrawSolver';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {isAddressEqual} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@gimmeDesignSystem/SuccessModal';
import {Button} from '@lib/primitives/Button';
import {VAULT_V3_ABI} from '@lib/utils/abi/vaultV3.abi';

import {useWithdrawFlow} from './useWithdrawFlow';

export function WithdrawWizard(props: {onClose: () => void}): ReactElement {
	const {vaultsArray} = useVaults();
	const {configuration, onResetWithdraw} = useWithdrawFlow();
	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.tokenToReceive?.address);
	const {getBalance, onRefresh} = useWallet();

	const {onExecuteWithdraw, onExecuteDeposit: onExecutePortalsWithdraw, quote, withdrawStatus} = useWithdrawSolver();
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

	const vault = vaultsArray.find(vault =>
		isAddressEqual(vault.token.address, toAddress(configuration.asset.token?.address))
	);

	const sharesBalance = getBalance({
		address: toAddress(vault?.address),
		chainID: Number(vault?.chainID)
	}).raw;

	const {data: assetBalance = 0n, isLoading: isFetchingAssetBalance} = useReadContract({
		abi: VAULT_V3_ABI,
		functionName: 'convertToAssets',
		args: [sharesBalance],
		address: toAddress(vault?.address),
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
				{vault?.name}
			</span>
		);
	}, [configuration.asset.normalizedBigAmount.display, configuration.asset.token?.symbol, vault?.name]);
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

				vault && tokensToRefresh.push({...vault.token, chainID: configuration.asset.token.chainID});
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
		[configuration.asset.token, configuration.tokenToReceive, chain.id, onRefresh, getModalMessage, vault]
	);

	const onAction = useCallback(async () => {
		if (!isZapNeeded) {
			return onExecuteWithdraw(() => onRefreshTokens('WITHDRAW'));
		}
		return onExecutePortalsWithdraw(() => onRefreshTokens('WITHDRAW'));
	}, [isZapNeeded, onExecutePortalsWithdraw, onExecuteWithdraw, onRefreshTokens]);

	const isAboveBalance = configuration.asset.normalizedBigAmount.raw > assetBalance;

	const isBusy = useMemo(() => {
		return withdrawStatus.pending || isFetchingAssetBalance;
	}, [isFetchingAssetBalance, withdrawStatus.pending]);

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

	return (
		<>
			<Button
				isBusy={isBusy}
				isDisabled={!isValid || isBusy}
				onClick={onAction}
				className={
					'disabled:!bg-grey-100 disabled:!text-grey-800 w-full !rounded-2xl !font-bold disabled:!opacity-100'
				}>
				{isBusy ? null : 'Withdraw'}
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
