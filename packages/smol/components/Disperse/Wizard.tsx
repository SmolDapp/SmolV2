import React, {useCallback, useMemo, useState} from 'react';
import toast from 'react-hot-toast';
import {usePlausible} from 'next-plausible';
import {type BaseError, erc20Abi, type Hex, zeroAddress} from 'viem';
import {useReadContract} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	ETH_TOKEN_ADDRESS,
	formatAmount,
	isZeroAddress,
	slugify,
	toAddress,
	toBigInt,
	toNormalizedValue,
	truncateHex,
	ZERO_ADDRESS,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20} from '@builtbymom/web3/utils/wagmi';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi/transaction';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {ErrorModal} from '@lib/common/ErrorModal';
import {SuccessModal} from '@lib/common/SuccessModal';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {Button} from '@lib/primitives/Button';
import {disperseERC20, disperseETH} from '@lib/utils/actions';
import {notifyDisperse} from '@lib/utils/notifier';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {CHAINS} from '@lib/utils/tools.chains';
import {getTransferTransaction} from '@lib/utils/tools.gnosis';
import {TWEETER_SHARE_CONTENT} from '@lib/utils/twitter';

import {useSend} from '../Send/useSend';
import {ExportConfigurationButton} from '.';
import {useDisperse} from './useDisperse';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TTxStatus} from '@builtbymom/web3/utils/wagmi/transaction';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';

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
	const {provider} = useWeb3();
	const {safeChainID, chainID} = useChainID();
	const {configuration} = useDisperse();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const {address} = useWeb3();

	const shouldApprove = useMemo((): boolean => {
		return toAddress(configuration.tokenToSend?.address) !== ETH_TOKEN_ADDRESS;
	}, [configuration.tokenToSend]);

	const {data: allowance = 0n, refetch} = useReadContract({
		abi: erc20Abi,
		functionName: 'allowance',
		args: [toAddress(address), CHAINS[safeChainID].disperseAddress],
		address: toAddress(configuration.tokenToSend?.address),
		query: {
			enabled:
				configuration.tokenToSend !== undefined &&
				toAddress(configuration.tokenToSend?.address) !== ETH_TOKEN_ADDRESS
		}
	});

	const isApproved = allowance >= totalToDisperse;
	const shouldUseSend = configuration.inputs.length === 1;
	const onApproveToken = useCallback(async (): Promise<void> => {
		if (isApproved) {
			return;
		}
		await approveERC20({
			connector: provider,
			chainID: chainID,
			contractAddress: toAddress(configuration.tokenToSend?.address),
			spenderAddress: CHAINS[safeChainID].disperseAddress,
			amount: totalToDisperse,
			statusHandler: set_approvalStatus
		}).then(result => {
			if (result.isSuccessful) {
				onSuccess();
				refetch();
			}
		});
	}, [
		isApproved,
		provider,
		chainID,
		safeChainID,
		configuration.tokenToSend?.address,
		totalToDisperse,
		onSuccess,
		refetch
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

const useConfirmDisperse = ({
	onTrigger,
	onSuccess,
	onError,
	totalToDisperse
}: {
	onTrigger: () => void;
	onSuccess: () => void;
	onError: () => void;
	totalToDisperse: bigint;
}): {onDisperseTokens: () => void} => {
	const {address, provider, isWalletSafe} = useWeb3();
	const {chainID, safeChainID} = useChainID();
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
					chains: [safeChainID],
					slugifiedLabel: slugify(address)
				});
			});
			plausible(PLAUSIBLE_EVENTS.DISPERSE_TOKENS, {
				props: {
					disperseChainID: safeChainID,
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
					chainID: safeChainID,
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
			safeChainID,
			totalToDisperse
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
				row.receiver.address === ZERO_ADDRESS ||
				row.receiver.address === ETH_TOKEN_ADDRESS
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
					chainID: safeChainID,
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
	}, [configuration.inputs, configuration.tokenToSend, sdk.txs, safeChainID, address, onSuccess, onError]);

	const onDisperseTokens = useCallback((): void => {
		onTrigger();
		if (isWalletSafe) {
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

		if (configuration.tokenToSend?.address === ETH_TOKEN_ADDRESS) {
			disperseETH({
				connector: provider,
				chainID: chainID,
				contractAddress: CHAINS[safeChainID].disperseAddress,
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
				connector: provider,
				chainID: chainID,
				contractAddress: CHAINS[safeChainID].disperseAddress,
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
		isWalletSafe,
		configuration.inputs,
		configuration.tokenToSend?.address,
		onDisperseTokensForGnosis,
		provider,
		safeChainID,
		chainID,
		onError,
		successDisperseCallback
	]);

	return {onDisperseTokens};
};

export function DisperseWizard(): ReactElement {
	const {configuration, onResetDisperse} = useDisperse();
	const [disperseStatus, set_disperseStatus] = useState(defaultTxStatus);
	const {getBalance} = useWallet();
	const plausible = usePlausible();
	const {safeChainID} = useChainID();

	const totalToDisperse = useMemo((): bigint => {
		return configuration.inputs.reduce((acc, row): bigint => acc + row.value.normalizedBigAmount.raw, 0n);
	}, [configuration.inputs]);

	const {isApproved, refetch, approvalStatus, onApproveToken, shouldUseSend} = useApproveDisperse({
		onSuccess: () => {
			set_disperseStatus(defaultTxStatus);
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
				chainID: configuration?.tokenToSend?.chainID || safeChainID,
				value: configuration?.tokenToSend?.value || 0,
				balance: configuration?.tokenToSend?.balance || zeroNormalizedBN
			}
		},
		set_disperseStatus
	);

	const onSendSingleToken = (): void => {
		onHandleMigration();
		plausible(PLAUSIBLE_EVENTS.DISPERSE_TOKENS, {
			props: {
				disperseChainID: safeChainID,
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
			set_disperseStatus({...defaultTxStatus, error: true});
		},
		onSuccess: () => {
			set_disperseStatus({...defaultTxStatus, success: true});
		},
		onTrigger: () => {
			set_disperseStatus({...defaultTxStatus, pending: true});
		},
		totalToDisperse
	});

	/**********************************************************************************************
	 ** handleApprove function is designed to call 2 transactions one by one. First we call
	 ** approve function then we disperse tokens.
	 *********************************************************************************************/
	const handleApprove = useCallback(async () => {
		await onApproveToken();

		refetch();
		onDisperseTokens();
	}, [onApproveToken, onDisperseTokens, refetch]);

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
				<b>{'Disperse'}</b>
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
					set_disperseStatus(defaultTxStatus);
				}}
			/>

			<ErrorModal
				title={'Error'}
				content={'An error occured while dispersing your token, please try again.'}
				ctaLabel={'Close'}
				isOpen={disperseStatus.error}
				onClose={(): void => {
					set_disperseStatus(defaultTxStatus);
				}}
			/>
		</div>
	);
}
