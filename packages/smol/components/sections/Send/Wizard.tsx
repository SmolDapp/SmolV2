import React, {useCallback, useState} from 'react';
import {usePlausible} from 'next-plausible';
import {isAddressEqual} from 'viem';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {
	ETH_TOKEN_ADDRESS,
	isEthAddress,
	isZeroAddress,
	slugify,
	toAddress,
	toBigInt,
	truncateHex,
	ZERO_ADDRESS
} from '@builtbymom/web3/utils';
import {getNetwork, transferERC20, transferEther} from '@builtbymom/web3/utils/wagmi';
import {defaultTxStatus, type TTxResponse} from '@builtbymom/web3/utils/wagmi';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {useDeepCompareMemo} from '@react-hookz/web';
import {ErrorModal} from '@lib/common/ErrorModal';
import {SuccessModal} from '@lib/common/SuccessModal';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {Button} from '@lib/primitives/Button';
import {notifySend} from '@lib/utils/notifier';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {getTransferTransaction} from '@lib/utils/tools.gnosis';

import {useSendFlow} from './useSendFlow';

import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TUseBalancesTokens} from '@builtbymom/web3/hooks/useBalances.multichains';
import type {TAddress, TChainTokens, TToken} from '@builtbymom/web3/types';
import type {BaseTransaction} from '@gnosis.pm/safe-apps-sdk';
import type {TTokenAmountInputElement} from '@lib/types/Inputs';
import type {TModify} from '@lib/utils/types/types';

type TInputWithToken = TModify<TTokenAmountInputElement, {token: TToken}>;

export function SendWizard({isReceiverERC20}: {isReceiverERC20: boolean}): ReactElement {
	const {safeChainID, chainID} = useChainID();
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useSendFlow();
	const {getToken, getBalance, onRefresh} = useWallet();
	const {bumpEntryInteractions} = useAddressBook();
	const {isWalletSafe, provider} = useWeb3();
	const {sdk} = useSafeAppsSDK();
	const [migrateStatus, set_migrateStatus] = useState(defaultTxStatus);

	const plausible = usePlausible();

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
		async (input: TInputWithToken): Promise<TTxResponse> => {
			const tokenAddress = input.token.address;
			const inputUUID = input.UUID;

			onUpdateStatus(inputUUID, 'pending');

			const result = await transferERC20({
				connector: provider,
				chainID: chainID,
				contractAddress: tokenAddress,
				receiverAddress: configuration.receiver?.address,
				amount: input.normalizedBigAmount.raw
			});
			if (result.isSuccessful) {
				onUpdateStatus(inputUUID, 'success');
			}
			if (result.error) {
				onUpdateStatus(inputUUID, 'error');
			}
			await handleSuccessCallback(tokenAddress);
			return result;
		},
		[configuration.receiver, handleSuccessCallback, onUpdateStatus, provider, chainID]
	);

	/**********************************************************************************************
	 ** The onMigrateETH function is called when the user clicks the 'Migrate' button. This
	 ** function will perform the migration for ETH coin.
	 **********************************************************************************************/
	const onMigrateETH = useCallback(
		async (input: TInputWithToken): Promise<TTxResponse> => {
			const inputUUID = input.UUID;
			onUpdateStatus(inputUUID, 'pending');
			const ethAmountRaw = input.normalizedBigAmount.raw;

			const isSendingBalance =
				toBigInt(ethAmountRaw) >= toBigInt(getBalance({address: ETH_TOKEN_ADDRESS, chainID: chainID})?.raw);
			const result = await transferEther({
				connector: provider,
				chainID: chainID,
				receiverAddress: configuration.receiver?.address,
				amount: toBigInt(ethAmountRaw),
				shouldAdjustForGas: isSendingBalance
			});
			if (result.isSuccessful) {
				onUpdateStatus(inputUUID, 'success');
			}
			if (result.error) {
				onUpdateStatus(inputUUID, 'error');
			}
			await handleSuccessCallback(ZERO_ADDRESS);
			return result;
		},
		[configuration.receiver?.address, getBalance, handleSuccessCallback, onUpdateStatus, provider, chainID]
	);

	/**********************************************************************************************
	 ** The onMigrateSelectedForGnosis function is called when the user clicks the 'Migrate' button
	 ** in the Gnosis Safe. This will take advantage of the batch transaction feature of the Gnosis
	 ** Safe.
	 **********************************************************************************************/
	const onMigrateSelectedForGnosis = useCallback(
		async (allSelected: TInputWithToken[]): Promise<void> => {
			const transactions: BaseTransaction[] = [];

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
				set_migrateStatus({...defaultTxStatus, success: true});

				notifySend({
					chainID: chainID,
					to: toAddress(configuration.receiver?.address),
					tokensMigrated: migratedTokens,
					hashes: migratedTokens.map((): Hex => safeTxHash as Hex),
					type: 'SAFE',
					from: toAddress(address)
				});
			} catch (error) {
				set_migrateStatus({...defaultTxStatus, error: true});
			}
		},
		[address, configuration.receiver?.address, migratedTokens, onUpdateStatus, chainID, sdk.txs]
	);

	/**********************************************************************************************
	 ** This is the main function that will be called when the user clicks on the 'Migrate' button.
	 ** It will iterate over the selected tokens and call the onMigrateERC20 function for each
	 ** token.
	 **********************************************************************************************/
	const onHandleMigration = useCallback(async (): Promise<void> => {
		set_migrateStatus({...defaultTxStatus, pending: true});

		let areAllSuccess = true;
		let ethToken: TInputWithToken | undefined = undefined;
		const hashMessage: Hex[] = [];
		const allSelected = configuration.inputs.filter(
			(input): input is TInputWithToken => !!input.token && input.status !== 'success'
		);

		if (isWalletSafe) {
			return onMigrateSelectedForGnosis(allSelected);
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
			set_migrateStatus({...defaultTxStatus, success: true});
		} else {
			set_migrateStatus({...defaultTxStatus, error: true});
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

		plausible(PLAUSIBLE_EVENTS.SEND_TOKENS, {
			props: {
				sendChainID: chainID,
				sendTo: toAddress(configuration.receiver?.address),
				sendFrom: toAddress(address)
			}
		});
	}, [
		plausible,
		configuration.inputs,
		configuration.receiver.address,
		isWalletSafe,
		bumpEntryInteractions,
		chainID,
		migratedTokens,
		address,
		onMigrateSelectedForGnosis,
		onMigrateERC20,
		onMigrateETH
	]);

	const errorModalContent =
		migratedTokens.length === 0
			? 'No tokens were sent, please try again.'
			: `${migratedTokens.map(token => token.token?.name).join(', ')} ${migratedTokens.length === 1 ? 'was' : 'were'} sent, please retry the rest.`;

	const isSendButtonDisabled =
		isZeroAddress(configuration.receiver?.address) ||
		isEthAddress(configuration.receiver.address) ||
		configuration.inputs.some(input => input.token && input.normalizedBigAmount.raw === toBigInt(0)) ||
		!configuration.inputs.every(input => input.isValid === true) ||
		isReceiverERC20;

	return (
		<>
			<Button
				className={'!h-8 w-full max-w-[240px] !text-xs'}
				isBusy={migrateStatus.pending}
				isDisabled={isSendButtonDisabled}
				onClick={onHandleMigration}>
				<b>{'Send'}</b>
			</Button>
			<SuccessModal
				title={'It looks like a success!'}
				content={
					'Like a fancy bird, your tokens have migrated! They are moving to their new home, with their new friends.'
				}
				ctaLabel={'Close'}
				isOpen={migrateStatus.success}
				onClose={(): void => {
					dispatchConfiguration({type: 'RESET', payload: undefined});
					set_migrateStatus(defaultTxStatus);
				}}
			/>

			<ErrorModal
				title={migratedTokens.length === 0 ? 'Error' : 'Partial Success'}
				content={errorModalContent}
				ctaLabel={'Close'}
				isOpen={migrateStatus.error}
				type={migratedTokens.length === 0 ? 'hard' : 'soft'}
				onClose={(): void => {
					set_migrateStatus(defaultTxStatus);
					setTimeout(() => {
						dispatchConfiguration({
							type: 'REMOVE_SUCCESFUL_INPUTS',
							payload: undefined
						});
					}, 500);
				}}
			/>
		</>
	);
}
