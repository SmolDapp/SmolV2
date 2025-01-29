import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {Button} from '@lib/primitives/Button';
import {disperseERC20, disperseETH} from '@lib/utils/actions';
import {slugify} from '@lib/utils/helpers';
import {notifyDisperse} from '@lib/utils/notifier';
import {formatAmount, toBigInt, toNormalizedValue, zeroNormalizedBN} from '@lib/utils/numbers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {CHAINS} from '@lib/utils/tools.chains';
import {approveERC20} from '@lib/utils/tools.erc20';
import {getTransferTransaction} from '@lib/utils/tools.gnosis';
import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {TWEETER_SHARE_CONTENT} from '@lib/utils/twitter';
import {ethTokenAddress, isZeroAddress, toAddress, truncateHex} from 'lib/utils/tools.addresses';
import {usePlausible} from 'next-plausible';
import React, {useCallback, useMemo, useState} from 'react';
import {toast} from 'react-hot-toast';
import {erc20Abi, zeroAddress} from 'viem';
import {useAccount, useChainId, useConfig, useReadContract} from 'wagmi';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {useWallet} from '@smolContexts/useWallet';
import {useIsSafe} from '@smolHooks/web3/useIsSafe';
import {ExportConfigurationButton} from 'packages/smol/app/(apps)/disperse/components/ExportConfigurationButton';
import {useDisperse} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse';
import {useSend} from 'packages/smol/app/(apps)/send/contexts/useSend';
import {ErrorModal} from 'packages/smol/common/ErrorModal';
import {SuccessModal} from 'packages/smol/common/SuccessModal';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TTxResponse, TTxStatus} from '@lib/utils/tools.transactions';
import type {ReactElement} from 'react';
import type {BaseError, Hex} from 'viem';

type TApprovalWizardProps = {
	onSuccess: () => void;
	totalToDisperse: bigint;
};

const useApproveDisperse = ({
	onSuccess,
	totalToDisperse
}: TApprovalWizardProps): {
	approvalStatus: TTxStatus;
	shouldApprove: boolean;
	allowance: bigint;
	isApproved: boolean;
	isDisabled: boolean;
	onApproveToken: () => Promise<void>;
	shouldUseSend: boolean;
	refetch: VoidFunction;
} => {
	const config = useConfig();
	const chainID = useChainId();
	const {address, connector} = useAccount();
	const {configuration} = useDisperse();
	const [approvalStatus, setApprovalStatus] = useState(defaultTxStatus);

	const shouldApprove = useMemo((): boolean => {
		return toAddress(configuration.tokenToSend?.address) !== ethTokenAddress;
	}, [configuration.tokenToSend]);

	const {data: allowance = 0n, refetch} = useReadContract({
		abi: erc20Abi,
		functionName: 'allowance',
		args: [toAddress(address), CHAINS[chainID].disperseAddress],
		address: toAddress(configuration.tokenToSend?.address),
		query: {
			enabled:
				configuration.tokenToSend !== undefined &&
				toAddress(configuration.tokenToSend?.address) !== ethTokenAddress
		}
	});

	const isApproved = allowance >= totalToDisperse;
	const shouldUseSend = configuration.inputs.length === 1;
	const onApproveToken = useCallback(async (): Promise<void> => {
		if (isApproved || !shouldApprove) {
			return;
		}
		const result = await approveERC20({
			config: config,
			connector: connector,
			chainID: chainID,
			contractAddress: toAddress(configuration.tokenToSend?.address),
			spenderAddress: CHAINS[chainID].disperseAddress,
			amount: totalToDisperse,
			statusHandler: setApprovalStatus
		});

		if (result.isSuccessful) {
			onSuccess();
			refetch();
		}
	}, [
		isApproved,
		shouldApprove,
		connector,
		chainID,
		configuration.tokenToSend?.address,
		totalToDisperse,
		onSuccess,
		refetch,
		config
	]);

	return {
		approvalStatus,
		shouldApprove,
		allowance,
		isApproved,
		isDisabled: !approvalStatus.none || !configuration.tokenToSend,
		onApproveToken,
		shouldUseSend,
		refetch
	};
};

const useConfirmDisperse = (props: {
	onTrigger: () => void;
	onSuccess: () => void;
	onError: () => void;
	totalToDisperse: bigint;
}): {onDisperseTokens: () => void} => {
	const {onTrigger, onSuccess, onError, totalToDisperse} = props;
	const isSafe = useIsSafe();
	const config = useConfig();
	const chainID = useChainId();
	const {address, connector} = useAccount();
	const {configuration} = useDisperse();
	const {bumpEntryInteractions} = useAddressBook();
	const {onRefresh} = useWallet();
	const {sdk} = useSafeAppsSDK();
	const plausible = usePlausible();

	const successDisperseCallback = useCallback(
		(disperseAddresses: TAddress[], disperseAmount: bigint[], result: TTxResponse) => {
			onSuccess();
			onRefresh([
				{
					decimals: configuration.tokenToSend?.decimals,
					name: configuration.tokenToSend?.name,
					symbol: configuration.tokenToSend?.symbol,
					address: toAddress(configuration.tokenToSend?.address),
					chainID: Number(configuration.tokenToSend?.chainID)
				}
			]);
			disperseAddresses.forEach(address => {
				bumpEntryInteractions({
					address: address,
					label: truncateHex(address, 5),
					chains: [chainID],
					slugifiedLabel: slugify(address)
				});
			});
			plausible(PLAUSIBLE_EVENTS.DISPERSE_TOKENS, {
				props: {
					disperseChainID: chainID,
					numberOfReceivers: disperseAddresses.length,
					tokenToDisperse: configuration.tokenToSend?.address,
					totalToDisperse: `${formatAmount(
						toNormalizedValue(totalToDisperse, configuration.tokenToSend?.decimals || 18),
						6,
						configuration.tokenToSend?.decimals || 18
					)} ${configuration.tokenToSend?.symbol || 'Tokens'}`
				}
			});
			if (result.receipt) {
				notifyDisperse({
					chainID: chainID,
					config: config,
					tokenToDisperse: configuration.tokenToSend,
					receivers: disperseAddresses,
					amounts: disperseAmount,
					type: 'EOA',
					from: result.receipt.from,
					hash: result.receipt.transactionHash
				});
			}
			return;
		},
		[
			bumpEntryInteractions,
			configuration.tokenToSend,
			onRefresh,
			onSuccess,
			plausible,
			chainID,
			totalToDisperse,
			config
		]
	);
	/**********************************************************************************************
	 ** onDisperseTokensForGnosis will do just like disperseTokens but for Gnosis Safe and without
	 ** the use of a smartcontract. It will just batch standard transfers.
	 **********************************************************************************************/
	const onDisperseTokensForGnosis = useCallback((): void => {
		const transactions: BaseTransaction[] = [];
		const disperseAddresses: TAddress[] = [];
		const disperseAmount: bigint[] = [];
		for (const row of configuration.inputs) {
			if (!row.value.amount || row.value.normalizedBigAmount.raw === 0n) {
				continue;
			}
			if (
				!row.receiver.address ||
				row.receiver.address === zeroAddress ||
				row.receiver.address === ethTokenAddress
			) {
				continue;
			}
			disperseAddresses.push(row.receiver.address);
			disperseAmount.push(row.value.normalizedBigAmount.raw);
			const newTransactionForBatch = getTransferTransaction(
				row.value.normalizedBigAmount.raw.toString(),
				toAddress(configuration.tokenToSend?.address),
				row.receiver.address
			);
			transactions.push(newTransactionForBatch);
		}
		try {
			sdk.txs.send({txs: transactions}).then(({safeTxHash}) => {
				toast.success('Your transaction has been created! You can now sign and execute it!');
				notifyDisperse({
					chainID: chainID,
					config: config,
					tokenToDisperse: configuration.tokenToSend,
					receivers: disperseAddresses,
					amounts: disperseAmount,
					type: 'SAFE',
					from: toAddress(address),
					hash: safeTxHash as Hex
				});
				onSuccess();
			});
		} catch (error) {
			toast.error((error as BaseError)?.message || 'An error occured while creating your transaction!');
			onError();
		}
	}, [configuration.inputs, configuration.tokenToSend, sdk.txs, chainID, address, onSuccess, onError, config]);

	const onDisperseTokens = useCallback((): void => {
		onTrigger();
		if (isSafe) {
			return onDisperseTokensForGnosis();
		}

		const [disperseAddresses, disperseAmount] = configuration.inputs
			.filter((row): boolean => {
				return (
					(toBigInt(row.value.normalizedBigAmount.raw) > 0n &&
						row.receiver.address &&
						!isZeroAddress(row.receiver.address)) ||
					false
				);
			})
			.reduce(
				(acc, row): [TAddress[], bigint[]] => {
					acc[0].push(toAddress(row.receiver.address));
					acc[1].push(toBigInt(row.value.normalizedBigAmount.raw));
					return acc;
				},
				[[] as TAddress[], [] as bigint[]]
			);

		if (configuration.tokenToSend?.address === ethTokenAddress) {
			disperseETH({
				config: config,
				connector: connector,
				chainID: chainID,
				contractAddress: CHAINS[chainID].disperseAddress,
				receivers: disperseAddresses,
				amounts: disperseAmount
			}).then(result => {
				if (result.isSuccessful) {
					return successDisperseCallback(disperseAddresses, disperseAmount, result);
				}
				onError();
			});
		} else {
			disperseERC20({
				config: config,
				connector: connector,
				chainID: chainID,
				contractAddress: CHAINS[chainID].disperseAddress,
				tokenToDisperse: toAddress(configuration.tokenToSend?.address),
				receivers: disperseAddresses,
				amounts: disperseAmount
			}).then(result => {
				if (result.isSuccessful) {
					return successDisperseCallback(disperseAddresses, disperseAmount, result);
				}
				onError();
			});
		}
	}, [
		onTrigger,
		isSafe,
		configuration.inputs,
		configuration.tokenToSend?.address,
		onDisperseTokensForGnosis,
		connector,
		chainID,
		onError,
		successDisperseCallback,
		config
	]);

	return {onDisperseTokens};
};

export function DisperseWizard(): ReactElement {
	const isSafe = useIsSafe();
	const {configuration, onResetDisperse} = useDisperse();
	const [disperseStatus, setDisperseStatus] = useState(defaultTxStatus);
	const {getBalance} = useWallet();
	const plausible = usePlausible();
	const chainID = useChainId();

	const totalToDisperse = useMemo((): bigint => {
		return configuration.inputs.reduce((acc, row): bigint => acc + row.value.normalizedBigAmount.raw, 0n);
	}, [configuration.inputs]);

	const {isApproved, refetch, approvalStatus, onApproveToken, shouldUseSend} = useApproveDisperse({
		onSuccess: () => {
			setDisperseStatus(defaultTxStatus);
		},
		totalToDisperse
	});

	const {onHandleMigration} = useSend(
		{
			receiver: configuration?.inputs[0]?.receiver.address || zeroAddress,
			amount: configuration?.inputs[0]?.value.normalizedBigAmount,
			token: {
				address: configuration.tokenToSend?.address || zeroAddress,
				name: configuration?.tokenToSend?.name || '',
				symbol: configuration?.tokenToSend?.symbol || '',
				decimals: configuration?.tokenToSend?.decimals || 18,
				chainID: configuration?.tokenToSend?.chainID || chainID,
				value: configuration?.tokenToSend?.value || 0,
				balance: configuration?.tokenToSend?.balance || zeroNormalizedBN
			}
		},
		setDisperseStatus
	);

	const onSendSingleToken = (): void => {
		onHandleMigration();
		plausible(PLAUSIBLE_EVENTS.DISPERSE_TOKENS, {
			props: {
				disperseChainID: chainID,
				numberOfReceivers: 1,
				tokenToDisperse: configuration.tokenToSend?.address,
				totalToDisperse: `${formatAmount(
					toNormalizedValue(totalToDisperse, configuration.tokenToSend?.decimals || 18),
					6,
					configuration.tokenToSend?.decimals || 18
				)} ${configuration.tokenToSend?.symbol || 'Tokens'}`
			}
		});
	};

	const {onDisperseTokens} = useConfirmDisperse({
		onError: () => {
			setDisperseStatus({...defaultTxStatus, error: true});
		},
		onSuccess: () => {
			setDisperseStatus({...defaultTxStatus, success: true});
		},
		onTrigger: () => {
			setDisperseStatus({...defaultTxStatus, pending: true});
		},
		totalToDisperse
	});

	/**********************************************************************************************
	 ** handleApprove function is designed to call 2 transactions one by one. First we call
	 ** approve function then we disperse tokens.
	 *********************************************************************************************/
	const handleApprove = useCallback(async () => {
		await onApproveToken();
		await refetch();
		await onDisperseTokens();
	}, [onApproveToken, onDisperseTokens, refetch]);

	/**********************************************************************************************
	 ** getButtonTitle function is designed to return the title of the button based on the current
	 ** state of the wizard. If the token isn't approved, the button will show "Approve & Disperse"
	 ** otherwise it will show "Disperse". If the token is ETH, the button will show "Disperse".
	 *********************************************************************************************/
	const getButtonTitle = (): string => {
		if (shouldUseSend) {
			return 'Disperse';
		}
		if (isSafe) {
			return 'Disperse';
		}
		if (toAddress(configuration.tokenToSend?.address) === ethTokenAddress) {
			return 'Disperse';
		}
		if (isApproved) {
			return 'Disperse';
		}
		return 'Approve & Disperse';
	};

	const isAboveBalance =
		totalToDisperse >
		getBalance({
			address: toAddress(configuration.tokenToSend?.address),
			chainID: Number(configuration.tokenToSend?.chainID)
		}).raw;

	const checkAlreadyExists = useCallback(
		(UUID: string, address: TAddress): boolean => {
			if (isZeroAddress(address)) {
				return false;
			}
			return configuration.inputs.some((row): boolean => row.UUID !== UUID && row.receiver.address === address);
		},
		[configuration.inputs]
	);

	const isValid = useMemo((): boolean => {
		return configuration.inputs.every((row): boolean => {
			if (!row.receiver.label && !row.receiver.address && toBigInt(row.value.normalizedBigAmount.raw) === 0n) {
				return false;
			}
			if (!row.receiver.address || isZeroAddress(row.receiver.address)) {
				return false;
			}
			if (checkAlreadyExists(row.UUID, row.receiver.address)) {
				return false;
			}
			if (!row.value.normalizedBigAmount || row.value.normalizedBigAmount.raw === 0n) {
				return false;
			}
			return true;
		});
	}, [configuration.inputs, checkAlreadyExists]);

	const getTotalToDisperseLabel = (): string => {
		if (totalToDisperse) {
			return `Total to Disperse: ${formatAmount(
				toNormalizedValue(totalToDisperse, configuration.tokenToSend?.decimals || 18),
				6,
				configuration.tokenToSend?.decimals || 18
			)} ${configuration.tokenToSend?.symbol || 'Tokens'}`;
		}
		return 'Nothing to Disperse yet';
	};

	return (
		<div className={'col-span-12 mt-4'}>
			{/* <small className={'pb-1 pl-1'}>{'Summary'}</small> */}
			<span
				suppressHydrationWarning
				className={'font-bold'}>
				{getTotalToDisperseLabel()}
			</span>
			<Button
				isBusy={disperseStatus.pending || approvalStatus.pending}
				isDisabled={isAboveBalance || configuration.inputs.length === 0 || !isValid}
				onClick={(): void | Promise<void> => {
					if (shouldUseSend) {
						return onSendSingleToken();
					}
					if (isApproved) {
						return onDisperseTokens();
					}
					return handleApprove();
				}}
				className={'mt-2 !h-8 w-full max-w-[240px] !text-xs'}>
				<b>{getButtonTitle()}</b>
			</Button>

			<SuccessModal
				title={'Success!'}
				content={`Successfully dispersed ${configuration.tokenToSend?.name} to ${configuration.inputs.length} receivers!`}
				twitterShareContent={TWEETER_SHARE_CONTENT.DISPERSE}
				ctaLabel={'Close'}
				downloadConfigButton={
					<ExportConfigurationButton
						className={'!h-10 w-full'}
						title={'Export Config'}
					/>
				}
				isOpen={disperseStatus.success}
				onClose={(): void => {
					onResetDisperse();
					setDisperseStatus(defaultTxStatus);
				}}
			/>

			<ErrorModal
				title={'Error'}
				content={'An error occured while dispersing your token, please try again.'}
				ctaLabel={'Close'}
				isOpen={disperseStatus.error}
				onClose={(): void => {
					setDisperseStatus(defaultTxStatus);
				}}
			/>
		</div>
	);
}
