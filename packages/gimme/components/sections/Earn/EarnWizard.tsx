import {useCallback, useMemo, useRef, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {assert, MAX_UINT_256, toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {allowanceOf, approveERC20} from '@builtbymom/web3/utils/wagmi';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi/transaction';
import {SuccessModal} from '@lib/common/SuccessModal';
import {Button} from '@lib/primitives/Button';
import {deposit, redeemV3Shares, withdrawShares} from '@lib/utils/actions';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import {useEarnFlow} from './useEarnFlow';

import type {ReactElement} from 'react';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
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
	onApprove: (amount: bigint) => Promise<void>;
} => {
	const {provider} = useWeb3();
	const {safeChainID} = useChainID();
	const {configuration} = useEarnFlow();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const {address} = useWeb3();

	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);

	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

	/* 🔵 - Yearn Finance ******************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 **************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (
				!configuration.asset.token ||
				!configuration.opportunity ||
				!provider ||
				configuration.asset.token.chainID !== safeChainID
			) {
				return zeroNormalizedBN;
			}

			const key = allowanceKey(
				safeChainID,
				toAddress(configuration.asset.token.address),
				toAddress(configuration.opportunity.address),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			const allowance = await allowanceOf({
				connector: provider,
				chainID: safeChainID,
				tokenAddress: toAddress(configuration.asset.token.address),
				spenderAddress: toAddress(configuration.opportunity.address)
			});
			existingAllowances.current[key] = toNormalizedBN(allowance, configuration.asset.token.decimals);
			return existingAllowances.current[key];
		},
		[configuration.asset.token, configuration.opportunity, provider, safeChainID, address]
	);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		set_allowance(await onRetrieveAllowance(true));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [address, configuration.asset.token?.address, configuration.asset.token?.address, onRetrieveAllowance]);

	/* 🔵 - Yearn Finance ******************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 **************************************************************************/
	const onApprove = useCallback(
		async (amount = MAX_UINT_256): Promise<void> => {
			assert(configuration.asset.token, 'Input token is not set');
			assert(configuration.opportunity, 'Output token is not set');

			const result = await approveERC20({
				connector: provider,
				chainID: configuration.opportunity.chainID,
				contractAddress: configuration.asset.token.address,
				spenderAddress: configuration.opportunity.address,
				amount: amount,
				statusHandler: set_approvalStatus
			});
			if (result.isSuccessful) {
				onSuccess();
				triggerRetreiveAllowance();
			}
		},
		[configuration.asset.token, configuration.opportunity, onSuccess, provider, triggerRetreiveAllowance]
	);

	const isAboveAllowance = allowance.raw >= configuration.asset.normalizedBigAmount.raw;

	return {
		approvalStatus,
		allowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove
	};
};

const useDeposit = ({
	onSuccess
}: {
	onSuccess: () => void;
}): {
	onExecuteDeposit: () => Promise<void>;
	onExecuteWithdraw: () => Promise<void>;
	depositStatus: TTxStatus;
	set_depositStatus: (value: TTxStatus) => void;
} => {
	const {configuration} = useEarnFlow();
	const {provider} = useWeb3();
	const {safeChainID} = useChainID();
	const {vaults} = useVaults();

	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);

	/* 🔵 - Yearn Finance ******************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 **************************************************************************/
	const onExecuteDeposit = useCallback(async (): Promise<void> => {
		assert(configuration.opportunity?.address, 'Output token is not set');
		assert(configuration.asset.token?.address, 'Input amount is not set');

		set_depositStatus({...defaultTxStatus, pending: true});

		const result = await deposit({
			connector: provider,
			chainID: safeChainID,
			contractAddress: configuration.opportunity?.address,
			amount: configuration.asset.normalizedBigAmount.raw
		});
		if (result.isSuccessful) {
			onSuccess();
			set_depositStatus({...defaultTxStatus, success: true});
			return;
		}
		set_depositStatus({...defaultTxStatus, error: true});
	}, [
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token?.address,
		configuration.opportunity?.address,
		onSuccess,
		provider,
		safeChainID
	]);

	/* 🔵 - Yearn Finance ******************************************************
	 ** Trigger a withdraw web3 action using the vault contract to take back
	 ** some underlying token from this specific vault.
	 **************************************************************************/
	const onExecuteWithdraw = useCallback(async (): Promise<void> => {
		assert(configuration.asset.token, 'Output token is not set');
		assert(configuration.asset.amount, 'Input amount is not set');
		const vault = vaults.find(vault =>
			isAddressEqual(vault.address, toAddress(configuration.asset.token?.address))
		);
		const isV3 = vault?.version.split('.')?.[0] === '3';

		let result;
		set_depositStatus({...defaultTxStatus, pending: true});

		if (isV3) {
			result = await redeemV3Shares({
				connector: provider,
				chainID: safeChainID,
				contractAddress: configuration.asset.token.address,
				amount: configuration.asset.normalizedBigAmount.raw,
				maxLoss: 1n
			});
		} else {
			result = await withdrawShares({
				connector: provider,
				chainID: safeChainID,
				contractAddress: configuration.asset.token.address,
				amount: configuration.asset.normalizedBigAmount.raw
			});
		}

		if (result.isSuccessful) {
			onSuccess();
			set_depositStatus({...defaultTxStatus, success: true});
			return;
		}
		set_depositStatus({...defaultTxStatus, error: true});
	}, [
		configuration.asset.amount,
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token,
		onSuccess,
		provider,
		safeChainID,
		vaults
	]);

	return {onExecuteDeposit, set_depositStatus, onExecuteWithdraw, depositStatus};
};

export function EarnWizard(): ReactElement {
	const {configuration, onResetEarn} = useEarnFlow();
	const {vaults} = useVaults();

	const {onApprove, isApproved, approvalStatus} = useApproveDeposit({
		onSuccess: () => console.log('success approve')
	});

	const {onExecuteDeposit, onExecuteWithdraw, set_depositStatus, depositStatus} = useDeposit({
		onSuccess: () => {
			console.log('success deposit');
		}
	});

	const isWithdrawing = useMemo(() => {
		return !!vaults.find(vault => isAddressEqual(vault.address, toAddress(configuration.asset.token?.address)));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [configuration.asset.token?.address, vaults.length]);
	const widrawingVaultName = isWithdrawing
		? vaults.find(vault => isAddressEqual(vault.address, toAddress(configuration.asset.token?.address)))?.name
		: undefined;

	const isValid = useMemo((): boolean => {
		if (!configuration.asset.amount || !configuration.asset.token) {
			return false;
		}
		if (!isWithdrawing && !configuration.opportunity) {
			return false;
		}

		return true;
	}, [configuration.asset.amount, configuration.asset.token, configuration.opportunity, isWithdrawing]);

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
			{/* <small className={'pb-1 pl-1'}>{'Summary'}</small> */}

			<Button
				isBusy={depositStatus.pending || approvalStatus.pending}
				isDisabled={!isValid}
				onClick={(): any => {
					if (isWithdrawing) {
						return onExecuteWithdraw();
					}
					if (isApproved) {
						return onExecuteDeposit();
					}
					return onApprove(configuration.asset.normalizedBigAmount.raw);
				}}
				className={'w-full'}>
				<b>{getButtonTitle()}</b>
			</Button>

			<SuccessModal
				title={'It looks like a success!'}
				content={`Successfully ${isWithdrawing ? 'withdrawn' : 'deposited'} ${configuration.asset.normalizedBigAmount.display} ${configuration.asset.token?.symbol} ${isWithdrawing ? 'from' : 'to'} ${configuration.opportunity?.name ?? widrawingVaultName}`}
				ctaLabel={isWithdrawing ? 'Deposit' : 'Another deposit'}
				isOpen={depositStatus.success}
				className={'!bg-white shadow-lg'}
				onClose={(): void => {
					onResetEarn();
					set_depositStatus(defaultTxStatus);
				}}
			/>

			{/* <ErrorModal
				title={'Error'}
				content={'An error occured while dispersing your token, please try again.'}
				ctaLabel={'Close'}
				isOpen={disperseStatus.error}
				onClose={(): void => {
					set_disperseStatus(defaultTxStatus);
				}}
			/> */}
		</div>
	);
}
