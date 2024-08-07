import {useCallback, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {useSolver} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, ETH_TOKEN_ADDRESS, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@gimmeDesignSystem/SuccessModal';
import {PLAUSIBLE_EVENTS} from '@gimmeutils/plausible';
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
	const {address, openLoginModal, isWalletSafe} = useWeb3();
	const {configuration, onResetEarn} = useEarnFlow();
	const {vaults} = useVaults();
	const chain = useCurrentChain();

	const [transactionResult, set_transactionResult] = useState<{isExecuted: boolean; message: ReactElement | null}>({
		isExecuted: false,
		message: null
	});

	const router = useRouter();
	const currentPage = router.pathname;
	const plausible = usePlausible();

	const onConnect = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.CONNECT_WALLET, {props: {currentPage}});
		openLoginModal();
	}, [currentPage, openLoginModal, plausible]);

	/**********************************************************************************************
	 ** Based on the user action, we can display a different message in the success modal.
	 *********************************************************************************************/
	const getModalMessage = useCallback((): ReactElement => {
		return (
			<span>
				{'Successfully deposited '}
				<span className={'text-grey-800'}>
					{configuration.asset.normalizedBigAmount.display} {configuration.asset.token?.symbol}
				</span>
				{' to '}
				{configuration.opportunity?.name} {'Vault'}
			</span>
		);
	}, [
		configuration.asset.normalizedBigAmount.display,
		configuration.asset.token?.symbol,
		configuration.opportunity?.name
	]);

	/**********************************************************************************************
	 ** After a successful transaction, this function can be called to refresh balances of the
	 ** tokens involved in the transaction (vault, asset, chain coin).
	 *********************************************************************************************/
	const onRefreshTokens = useCallback(
		(kind: 'APPROVE' | 'DEPOSIT') => {
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

				const vaultToken = vaults[configuration.asset.token?.address]
					? (vaults[configuration.asset.token?.address].token ?? null)
					: null;

				vaultToken &&
					vaults[configuration.asset.token?.address] &&
					tokensToRefresh.push({...vaultToken, chainID: vaults[configuration.asset.token?.address].chainID});
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

		onExecuteForGnosis,

		isFetchingQuote,
		quote
	} = useSolver();

	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.opportunity?.token.address);
	const isAboveBalance =
		configuration.asset.normalizedBigAmount.raw >
		getBalance({
			address: toAddress(configuration.asset.token?.address),
			chainID: Number(configuration.asset.token?.chainID)
		}).raw;

	/**********************************************************************************************
	 ** Once the transaction is done, we can close the modal and reset the state of the wizard.
	 *********************************************************************************************/
	const onCloseModal = useCallback(() => {
		set_transactionResult({isExecuted: false, message: null});
		onResetEarn();
	}, [onResetEarn]);

	const triggerPlausibleEvent = useCallback(() => {
		const {token} = configuration.asset;
		const vault = configuration.opportunity;
		plausible(PLAUSIBLE_EVENTS.DEPOSIT, {
			props: {
				tokenAddress: toAddress(token?.address),
				tokenName: token?.name,
				vaultAddress: toAddress(vault?.address),
				vaultName: vault?.name,
				vaultChainID: vault?.chainID,
				isSwap: isZapNeeded,
				tokenAmount: configuration.asset.amount
			}
		});
	}, [configuration.asset, configuration.opportunity, isZapNeeded, plausible]);

	const onAction = useCallback(async () => {
		if (isWalletSafe) {
			return onExecuteForGnosis(() => {
				triggerPlausibleEvent();
				onRefreshTokens('DEPOSIT');
			});
		}
		if (isApproved) {
			return onExecuteDeposit(() => {
				triggerPlausibleEvent();
				onRefreshTokens('DEPOSIT');
			});
		}
		return onApprove(() => onRefreshTokens('APPROVE'));
	}, [
		isApproved,
		isWalletSafe,
		onApprove,
		onExecuteDeposit,
		onExecuteForGnosis,
		onRefreshTokens,
		triggerPlausibleEvent
	]);

	const isValid = useMemo((): boolean => {
		if (isAboveBalance) {
			return false;
		}
		if (isZapNeeded && !quote) {
			return false;
		}
		if (!configuration.opportunity) {
			return false;
		}
		{
			if (!configuration.asset.amount || !configuration.asset.token) {
				return false;
			}
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
		isZapNeeded,
		quote
	]);

	const getButtonTitle = (): string => {
		if (!configuration.asset.token || !configuration.opportunity) {
			return 'Select Token or Opportunity';
		}

		if (isWalletSafe) {
			return 'Approve and Deposit';
		}

		if (isApproved) {
			return 'Deposit';
		}

		return 'Approve';
	};

	const isBusy = depositStatus.pending || approvalStatus.pending || isFetchingAllowance || isFetchingQuote;

	return (
		<div className={'col-span-12'}>
			{address ? (
				<Button
					isBusy={isBusy}
					isDisabled={!isValid || isBusy}
					onClick={onAction}
					className={cl(
						'disabled:!bg-grey-100 w-full !rounded-2xl !font-bold disabled:!opacity-100 disabled:!text-grey-800'
					)}>
					{isBusy ? null : getButtonTitle()}
				</Button>
			) : (
				<Button
					className={'w-full !rounded-2xl !font-bold'}
					onClick={onConnect}>
					{'Connect Wallet'}
				</Button>
			)}

			<SuccessModal
				title={'Success!'}
				content={transactionResult.message}
				ctaLabel={'Ok'}
				isOpen={transactionResult.isExecuted}
				className={'!bg-white'}
				onClose={onCloseModal}
			/>
		</div>
	);
}
