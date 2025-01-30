import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {useWallet} from '@lib/contexts/useWallet';
import {useIsSafe} from '@lib/hooks/web3/useIsSafe';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useCallback} from 'react';
import {isAddressEqual, zeroAddress} from 'viem';
import {useAccount, useChainId, useConfig} from 'wagmi';

import {slugify} from '@lib/utils/helpers';
import {notifySend} from '@lib/utils/notifier';
import {toBigInt} from '@lib/utils/numbers';
import {ethTokenAddress, isZeroAddress, toAddress, truncateHex} from '@lib/utils/tools.addresses';
import {transferERC20} from '@lib/utils/tools.erc20';
import {getTransferTransaction} from '@lib/utils/tools.gnosis';
import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {transferEthers} from 'packages/smol/app/(apps)/send/contexts/transferEthers';
import {useSendContext} from 'packages/smol/app/(apps)/send/contexts/useSendContext';

import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TTokenAmountInputElement} from '@lib/common/SmolTokenAmountInput';
import type {TUseBalancesTokens} from '@lib/contexts/useBalances.multichains';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TChainERC20Tokens} from '@lib/utils/tools.erc20';
import type {TTxResponse, TTxStatus} from '@lib/utils/tools.transactions';
import type {TDisperseTxInfo, TInputWithToken} from 'packages/smol/app/(apps)/disperse/types';
import type {Hex} from 'viem';

export const useSend = (
	txInfo?: TDisperseTxInfo,
	setDisperseStatus?: (value: TTxStatus) => void,
	setMigrateStatus?: (value: TTxStatus) => void
): {onHandleMigration: () => void; migratedTokens: TTokenAmountInputElement[]} => {
	const chainID = useChainId();
	const config = useConfig();
	const {address, connector} = useAccount();
	const {configuration, dispatchConfiguration} = useSendContext();
	const {bumpEntryInteractions} = useAddressBook();
	const isSafe = useIsSafe();
	const {sdk} = useSafeAppsSDK();
	const {getToken, getBalance, onRefresh} = useWallet();

	const migratedTokens = useDeepCompareMemo(
		() => configuration.inputs.filter(input => input.status === 'success'),
		[configuration.inputs]
	);

	const onUpdateStatus = useCallback(
		(UUID: string, status: 'pending' | 'success' | 'error' | 'none'): void => {
			dispatchConfiguration({
				type: 'SET_VALUE',
				payload: {
					UUID,
					status
				}
			});
		},
		[dispatchConfiguration]
	);

	/**********************************************************************************************
	 ** The handleSuccessCallback is called when a transaction is successful. It will update the
	 ** balances for the token that was transferred and the ETH token. It will also remove the token
	 ** from the selected state.
	 **********************************************************************************************/
	const handleSuccessCallback = useCallback(
		async (tokenAddress: TAddress): Promise<TChainERC20Tokens> => {
			const network = config.chains.find(chain => chain.id === chainID);
			const chainCoin = network?.nativeCurrency;
			const tokensToRefresh: TUseBalancesTokens[] = [
				{
					address: ethTokenAddress,
					decimals: chainCoin?.decimals || 18,
					symbol: chainCoin?.symbol || 'ETH',
					name: chainCoin?.name || 'Ether',
					chainID: chainID
				}
			];
			const token = getToken({address: tokenAddress, chainID: chainID});
			if (!isZeroAddress(tokenAddress)) {
				tokensToRefresh.push({
					address: tokenAddress,
					decimals: token.decimals,
					symbol: token.symbol,
					name: token.name,
					chainID: chainID
				});
			}

			const updatedBalances = await onRefresh(tokensToRefresh);
			return updatedBalances;
		},
		[config, getToken, onRefresh, chainID]
	);

	/**********************************************************************************************
	 ** The onMigrateERC20 function is called when the user clicks the 'Migrate' button. This
	 ** function will perform the migration for all the selected tokens, one at a time.
	 **********************************************************************************************/
	const onMigrateERC20 = useCallback(
		async (input?: TInputWithToken, txInfo?: TDisperseTxInfo): Promise<TTxResponse> => {
			const tokenAddress = input?.token.address;
			const inputUUID = input?.UUID;

			if (inputUUID) {
				onUpdateStatus(inputUUID, 'pending');
			}
			setDisperseStatus?.({...defaultTxStatus, pending: true});

			const result = await transferERC20({
				config: config,
				connector: connector,
				chainID: chainID,
				contractAddress: txInfo?.token.address ?? tokenAddress,
				receiver: txInfo?.receiver ?? configuration.receiver?.address,
				amount: txInfo?.amount.raw ?? (input?.normalizedBigAmount.raw || 0n)
			});

			if (result.isSuccessful) {
				if (inputUUID) {
					onUpdateStatus(inputUUID, 'success');
				}
				setDisperseStatus?.({...defaultTxStatus, success: result.isSuccessful});
			}
			if (result.error) {
				if (inputUUID) {
					onUpdateStatus(inputUUID, 'error');
				}
				setDisperseStatus?.({...defaultTxStatus, error: Boolean(result.error)});
			}

			if (tokenAddress) {
				await handleSuccessCallback(tokenAddress);
			}

			if (txInfo?.token.address) {
				await handleSuccessCallback(txInfo?.token.address);
			}
			return result;
		},
		[
			onUpdateStatus,
			connector,
			chainID,
			configuration.receiver?.address,
			setDisperseStatus,
			handleSuccessCallback,
			config
		]
	);

	/**********************************************************************************************
	 ** The onMigrateETH function is called when the user clicks the 'Migrate' button. This
	 ** function will perform the migration for ETH coin.
	 **********************************************************************************************/
	const onMigrateETH = useCallback(
		async (input?: TInputWithToken, txInfo?: TDisperseTxInfo): Promise<TTxResponse> => {
			const inputUUID = input?.UUID;
			if (inputUUID) {
				onUpdateStatus(inputUUID, 'pending');
			}
			setDisperseStatus?.({...defaultTxStatus, pending: true});

			const ethAmountRaw = input?.normalizedBigAmount.raw ?? txInfo?.amount.raw;

			const isSendingBalance =
				toBigInt(ethAmountRaw) >= toBigInt(getBalance({address: ethTokenAddress, chainID: chainID})?.raw);
			const result = await transferEthers({
				config: config,
				connector: connector,
				chainID: chainID,
				receiver: configuration.receiver?.address ?? txInfo?.receiver,
				amount: toBigInt(ethAmountRaw),
				shouldAdjustForGas: isSendingBalance
			});
			if (result.isSuccessful) {
				if (inputUUID) {
					onUpdateStatus(inputUUID, 'success');
				}
			}
			if (result.error) {
				if (inputUUID) {
					onUpdateStatus(inputUUID, 'error');
				}
			}
			await handleSuccessCallback(zeroAddress);
			return result;
		},
		[
			onUpdateStatus,
			setDisperseStatus,
			getBalance,
			chainID,
			connector,
			configuration.receiver?.address,
			handleSuccessCallback,
			config
		]
	);

	/**********************************************************************************************
	 ** The onMigrateSelectedForGnosis function is called when the user clicks the 'Migrate' button
	 ** in the Gnosis Safe. This will take advantage of the batch transaction feature of the Gnosis
	 ** Safe.
	 **********************************************************************************************/
	const onMigrateSelectedForGnosis = useCallback(
		async (allSelected: TInputWithToken[], txInfo?: TDisperseTxInfo): Promise<void> => {
			const transactions: BaseTransaction[] = [];

			if (txInfo) {
				const newTransaction = getTransferTransaction(
					txInfo.amount.toString(),
					txInfo.token.address,
					toAddress(txInfo.receiver)
				);
				const {safeTxHash} = await sdk.txs.send({txs: [newTransaction]});

				const migratedToken: TTokenAmountInputElement = {
					amount: txInfo.amount.display,
					normalizedBigAmount: txInfo.amount,
					token: txInfo.token,
					status: 'success',
					isValid: true,
					UUID: crypto.randomUUID()
				};

				notifySend({
					chainID: chainID,
					config: config,
					to: toAddress(txInfo.receiver),
					tokensMigrated: [migratedToken],
					hashes: [migratedToken].map((): Hex => safeTxHash as Hex),
					type: 'SAFE',
					from: toAddress(address)
				});

				return setDisperseStatus?.({...defaultTxStatus, success: true});
			}

			for (const input of allSelected) {
				const amount = toBigInt(input.normalizedBigAmount.raw);
				if (amount === 0n) {
					continue;
				}
				const newTransactionForBatch = getTransferTransaction(
					amount.toString(),
					input.token.address,
					toAddress(configuration.receiver?.address)
				);
				transactions.push(newTransactionForBatch);
			}
			try {
				allSelected.forEach(input => onUpdateStatus(input.UUID, 'pending'));
				const {safeTxHash} = await sdk.txs.send({txs: transactions});
				allSelected.forEach(input => onUpdateStatus(input.UUID, 'success'));
				setMigrateStatus?.({...defaultTxStatus, success: true});

				notifySend({
					chainID: chainID,
					config: config,
					to: toAddress(configuration.receiver?.address),
					tokensMigrated: migratedTokens,
					hashes: migratedTokens.map((): Hex => safeTxHash as Hex),
					type: 'SAFE',
					from: toAddress(address)
				});
			} catch (error) {
				console.error(error);
				setMigrateStatus?.({...defaultTxStatus, error: true});
			}
		},
		[
			sdk.txs,
			setDisperseStatus,
			configuration.receiver?.address,
			setMigrateStatus,
			chainID,
			migratedTokens,
			address,
			onUpdateStatus,
			config
		]
	);

	/**********************************************************************************************
	 ** This is the main function that will be called when the user clicks on the 'Migrate' button.
	 ** It will iterate over the selected tokens and call the onMigrateERC20 function for each
	 ** token.
	 **********************************************************************************************/
	const onHandleMigration = useCallback(async (): Promise<void> => {
		setMigrateStatus?.({...defaultTxStatus, pending: true});

		let areAllSuccess = true;
		let ethToken: TInputWithToken | undefined = undefined;
		const hashMessage: Hex[] = [];
		const allSelected = configuration.inputs.filter(
			(input): input is TInputWithToken => !!input.token && input.status !== 'success'
		);

		if (isSafe) {
			if (txInfo) {
				return onMigrateSelectedForGnosis([], txInfo);
			}
			return onMigrateSelectedForGnosis(allSelected);
		}

		if (txInfo && isAddressEqual(txInfo.token.address, ethTokenAddress)) {
			const result = await onMigrateETH(undefined, txInfo);
			if (result.isSuccessful) {
				return setDisperseStatus?.({...defaultTxStatus, success: true});
			}
			return setDisperseStatus?.({...defaultTxStatus, error: true});
		}

		if (txInfo && !isAddressEqual(txInfo.token.address, ethTokenAddress)) {
			const result = await onMigrateERC20(undefined, txInfo);
			if (result.isSuccessful) {
				return setDisperseStatus?.({...defaultTxStatus, success: true});
			}
			return setDisperseStatus?.({...defaultTxStatus, error: true});
		}

		for (const input of allSelected) {
			if (isAddressEqual(input.token.address, ethTokenAddress)) {
				ethToken = input; //Migrate ETH at the end
				continue;
			}

			const result = await onMigrateERC20(input);

			if (result.isSuccessful && result.receipt) {
				hashMessage.push(result.receipt.transactionHash);
			} else {
				areAllSuccess = false;
			}
		}

		const ethAmountRaw = ethToken?.normalizedBigAmount?.raw;

		if (ethToken && toBigInt(ethAmountRaw) > 0n) {
			const result = await onMigrateETH(ethToken);
			if (result.isSuccessful && result.receipt) {
				hashMessage.push(result.receipt.transactionHash);
			} else {
				areAllSuccess = false;
			}
		}

		if (areAllSuccess) {
			setMigrateStatus?.({...defaultTxStatus, success: true});
		} else {
			setMigrateStatus?.({...defaultTxStatus, error: true});
		}

		bumpEntryInteractions({
			address: configuration.receiver.address,
			label: truncateHex(toAddress(configuration.receiver.address), 5),
			chains: [chainID],
			slugifiedLabel: slugify(configuration.receiver.address || '')
		});

		notifySend({
			chainID: chainID,
			config: config,
			to: toAddress(configuration.receiver?.address),
			tokensMigrated: migratedTokens,
			hashes: hashMessage,
			type: 'EOA',
			from: toAddress(address)
		});
	}, [
		setMigrateStatus,
		configuration.inputs,
		configuration.receiver.address,
		isSafe,
		txInfo,
		bumpEntryInteractions,
		chainID,
		migratedTokens,
		address,
		onMigrateSelectedForGnosis,
		onMigrateETH,
		setDisperseStatus,
		onMigrateERC20,
		config
	]);
	return {onHandleMigration, migratedTokens};
};
