import {useCallback} from 'react';
import {isAddressEqual} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	assertAddress,
	ETH_TOKEN_ADDRESS,
	isZeroAddress,
	slugify,
	toAddress,
	toBigInt,
	truncateHex,
	ZERO_ADDRESS
} from '@builtbymom/web3/utils';
import {
	defaultTxStatus,
	getNetwork,
	retrieveConfig,
	toWagmiProvider,
	transferERC20
} from '@builtbymom/web3/utils/wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useDeepCompareMemo} from '@react-hookz/web';
import {getGasPrice, sendTransaction, waitForTransactionReceipt} from '@wagmi/core';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {notifySend} from '@lib/utils/notifier';
import {getTransferTransaction} from '@lib/utils/tools.gnosis';

import {useSendContext} from './useSendContext';

import type {Hex} from 'viem';
import type {BaseError} from 'wagmi';
import type {TUseBalancesTokens} from '@builtbymom/web3/hooks/useBalances.multichains';
import type {TAddress, TChainTokens} from '@builtbymom/web3/types';
import type {TTxResponse, TTxStatus, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TDisperseTxInfo, TInputWithToken} from '@lib/types/app.disperse';
import type {TTokenAmountInputElement} from '@lib/types/utils';

type TTransferEther = Omit<TWriteTransaction, 'contractAddress'> & {
	receiver: TAddress | undefined;
	amount: bigint;
	shouldAdjustForGas?: boolean;
	confirmation?: number;
};
export async function transferLegacyEther(props: TTransferEther): Promise<TTxResponse> {
	assertAddress(props.receiver, 'receiver');

	props.statusHandler?.({...defaultTxStatus, pending: true});
	const wagmiProvider = await toWagmiProvider(props.connector);

	assertAddress(wagmiProvider.address, 'userAddress');
	try {
		let adjustedAmount = props.amount;

		let gasFee: bigint = 0n;
		if (props.shouldAdjustForGas) {
			// Estimate gas for the transaction
			gasFee = await getGasPrice(retrieveConfig(), {
				chainId: wagmiProvider.chainId
			});

			// Calculate gas cost and subtract from amount
			const gasCost = 21000n * gasFee;
			adjustedAmount = props.amount - gasCost;

			// Ensure we don't go negative
			if (adjustedAmount <= 0n) {
				throw new Error('Insufficient funds to cover gas costs');
			}
		}

		const hash = await sendTransaction(retrieveConfig(), {
			chainId: wagmiProvider.chainId,
			to: props.receiver,
			value: adjustedAmount,
			type: 'legacy'
		});
		const receipt = await waitForTransactionReceipt(retrieveConfig(), {
			chainId: wagmiProvider.chainId,
			hash,
			confirmations: props.confirmation ?? (process.env.NODE_ENV === 'development' ? 1 : undefined)
		});
		if (receipt.status === 'success') {
			props.statusHandler?.({...defaultTxStatus, success: true});
		} else if (receipt.status === 'reverted') {
			props.statusHandler?.({...defaultTxStatus, error: true});
		}
		return {isSuccessful: receipt.status === 'success', receipt};
	} catch (error) {
		console.error(error);
		const errorAsBaseError = error as BaseError;
		props.statusHandler?.({...defaultTxStatus, error: true});
		return {isSuccessful: false, error: errorAsBaseError || ''};
	} finally {
		setTimeout((): void => {
			props.statusHandler?.({...defaultTxStatus});
		}, 3000);
	}
}

export const useSend = (
	txInfo?: TDisperseTxInfo,
	set_disperseStatus?: (value: TTxStatus) => void,
	set_migrateStatus?: (value: TTxStatus) => void
): {onHandleMigration: () => void; migratedTokens: TTokenAmountInputElement[]} => {
	const {safeChainID, chainID} = useChainID();
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useSendContext();
	const {bumpEntryInteractions} = useAddressBook();
	const {isWalletSafe, provider} = useWeb3();
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
		async (tokenAddress: TAddress): Promise<TChainTokens> => {
			const chainCoin = getNetwork(safeChainID).nativeCurrency;
			const tokensToRefresh: TUseBalancesTokens[] = [
				{
					address: ETH_TOKEN_ADDRESS,
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
		[safeChainID, chainID, getToken, onRefresh]
	);

	/**********************************************************************************************
	 ** The onMigrateERC20 function is called when the user clicks the 'Migrate' button. This
	 ** function will perform the migration for all the selected tokens, one at a time.
	 **********************************************************************************************/
	const onMigrateERC20 = useCallback(
		async (input?: TInputWithToken, txInfo?: TDisperseTxInfo): Promise<TTxResponse> => {
			const tokenAddress = input?.token.address;
			const inputUUID = input?.UUID;

			inputUUID && onUpdateStatus(inputUUID, 'pending');
			set_disperseStatus?.({...defaultTxStatus, pending: true});

			const result = await transferERC20({
				connector: provider,
				chainID: chainID,
				contractAddress: txInfo?.token.address ?? tokenAddress,
				receiverAddress: txInfo?.receiver ?? configuration.receiver?.address,
				amount: txInfo?.amount.raw ?? (input?.normalizedBigAmount.raw || 0n)
			});

			if (result.isSuccessful) {
				inputUUID && onUpdateStatus(inputUUID, 'success');
				set_disperseStatus?.({...defaultTxStatus, success: result.isSuccessful});
			}
			if (result.error) {
				inputUUID && onUpdateStatus(inputUUID, 'error');
				set_disperseStatus?.({...defaultTxStatus, error: Boolean(result.error)});
			}

			if (tokenAddress) {
				await handleSuccessCallback(tokenAddress);
			}

			if (txInfo?.token.address) {
				await handleSuccessCallback(txInfo?.token.address);
			}
			return result;
		},
		[onUpdateStatus, provider, chainID, configuration.receiver?.address, set_disperseStatus, handleSuccessCallback]
	);

	/**********************************************************************************************
	 ** The onMigrateETH function is called when the user clicks the 'Migrate' button. This
	 ** function will perform the migration for ETH coin.
	 **********************************************************************************************/
	const onMigrateETH = useCallback(
		async (input?: TInputWithToken, txInfo?: TDisperseTxInfo): Promise<TTxResponse> => {
			const inputUUID = input?.UUID;
			inputUUID && onUpdateStatus(inputUUID, 'pending');
			set_disperseStatus?.({...defaultTxStatus, pending: true});

			const ethAmountRaw = input?.normalizedBigAmount.raw ?? txInfo?.amount.raw;

			const isSendingBalance =
				toBigInt(ethAmountRaw) >= toBigInt(getBalance({address: ETH_TOKEN_ADDRESS, chainID: chainID})?.raw);

			const result = await transferLegacyEther({
				connector: provider,
				chainID: chainID,
				receiver: configuration.receiver?.address ?? txInfo?.receiver,
				amount: toBigInt(ethAmountRaw),
				shouldAdjustForGas: isSendingBalance
			});
			if (result.isSuccessful) {
				inputUUID && onUpdateStatus(inputUUID, 'success');
			}
			if (result.error) {
				inputUUID && onUpdateStatus(inputUUID, 'error');
			}
			await handleSuccessCallback(ZERO_ADDRESS);
			return result;
		},
		[
			onUpdateStatus,
			set_disperseStatus,
			getBalance,
			chainID,
			provider,
			configuration.receiver?.address,
			handleSuccessCallback
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
					to: toAddress(txInfo.receiver),
					tokensMigrated: [migratedToken],
					hashes: [migratedToken].map((): Hex => safeTxHash as Hex),
					type: 'SAFE',
					from: toAddress(address)
				});

				return set_disperseStatus?.({...defaultTxStatus, success: true});
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
				set_migrateStatus?.({...defaultTxStatus, success: true});

				notifySend({
					chainID: chainID,
					to: toAddress(configuration.receiver?.address),
					tokensMigrated: migratedTokens,
					hashes: migratedTokens.map((): Hex => safeTxHash as Hex),
					type: 'SAFE',
					from: toAddress(address)
				});
			} catch (error) {
				set_migrateStatus?.({...defaultTxStatus, error: true});
			}
		},
		[
			sdk.txs,
			set_disperseStatus,
			configuration.receiver?.address,
			set_migrateStatus,
			chainID,
			migratedTokens,
			address,
			onUpdateStatus
		]
	);

	/**********************************************************************************************
	 ** This is the main function that will be called when the user clicks on the 'Migrate' button.
	 ** It will iterate over the selected tokens and call the onMigrateERC20 function for each
	 ** token.
	 **********************************************************************************************/
	const onHandleMigration = useCallback(async (): Promise<void> => {
		set_migrateStatus?.({...defaultTxStatus, pending: true});

		let areAllSuccess = true;
		let ethToken: TInputWithToken | undefined = undefined;
		const hashMessage: Hex[] = [];
		const allSelected = configuration.inputs.filter(
			(input): input is TInputWithToken => !!input.token && input.status !== 'success'
		);

		if (isWalletSafe) {
			if (txInfo) {
				return onMigrateSelectedForGnosis([], txInfo);
			}
			return onMigrateSelectedForGnosis(allSelected);
		}

		if (txInfo && isAddressEqual(txInfo.token.address, ETH_TOKEN_ADDRESS)) {
			const result = await onMigrateETH(undefined, txInfo);
			if (result.isSuccessful) {
				return set_disperseStatus?.({...defaultTxStatus, success: true});
			}
			return set_disperseStatus?.({...defaultTxStatus, error: true});
		}

		if (txInfo && !isAddressEqual(txInfo.token.address, ETH_TOKEN_ADDRESS)) {
			const result = await onMigrateERC20(undefined, txInfo);
			if (result.isSuccessful) {
				return set_disperseStatus?.({...defaultTxStatus, success: true});
			}
			return set_disperseStatus?.({...defaultTxStatus, error: true});
		}

		for (const input of allSelected) {
			if (isAddressEqual(input.token.address, ETH_TOKEN_ADDRESS)) {
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
			set_migrateStatus?.({...defaultTxStatus, success: true});
		} else {
			set_migrateStatus?.({...defaultTxStatus, error: true});
		}

		bumpEntryInteractions({
			address: configuration.receiver.address,
			label: truncateHex(toAddress(configuration.receiver.address), 5),
			chains: [chainID],
			slugifiedLabel: slugify(configuration.receiver.address || '')
		});

		notifySend({
			chainID: chainID,
			to: toAddress(configuration.receiver?.address),
			tokensMigrated: migratedTokens,
			hashes: hashMessage,
			type: 'EOA',
			from: toAddress(address)
		});
	}, [
		set_migrateStatus,
		configuration.inputs,
		configuration.receiver.address,
		isWalletSafe,
		txInfo,
		bumpEntryInteractions,
		chainID,
		migratedTokens,
		address,
		onMigrateSelectedForGnosis,
		onMigrateETH,
		set_disperseStatus,
		onMigrateERC20
	]);
	return {onHandleMigration, migratedTokens};
};
