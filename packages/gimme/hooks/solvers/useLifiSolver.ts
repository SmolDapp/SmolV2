import {useCallback, useRef, useState} from 'react';
import {encodeFunctionData, erc20Abi, isHex, parseAbi} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	isEthAddress,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {getContractCallsQuote} from '@lifi/sdk';
import {readContract, sendTransaction, waitForTransactionReceipt} from '@wagmi/core';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {ContractCallsQuoteRequest, LiFiStep} from '@lifi/sdk';

export const useLifiSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean,
	isBridgeNeededForDeposit: boolean,
	isBridgeNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useEarnFlow();
	const {address, provider} = useWeb3();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [latestQuote, set_latestQuote] = useState<LiFiStep>();
	const [isFetchingQuote, set_isFetchingQuote] = useState(false);
	const spendAmount = configuration?.asset.normalizedBigAmount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;

	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

	const onRetrieveQuote = useCallback(async () => {
		if (
			!configuration?.asset.token ||
			!configuration?.opportunity ||
			configuration?.asset.normalizedBigAmount === zeroNormalizedBN
		) {
			return;
		}

		const config = {
			fromChain: configuration.asset.token.chainID,
			toChain: configuration.opportunity.chainID,
			fromToken: configuration.asset.token.address,
			amount: toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(), // WETH amount
			vaultAddress: configuration.opportunity.address,
			vaultAsset: configuration.opportunity.token.address,
			depositGas: '100000', // e.g. https://polygonscan.com/tx/0xcaf0322cc1ef9e1a0d9049733752f602fb50018c15c04926ea8ecf8c7b39a022
			depositContractAbi: ['function deposit(uint amount, address to) external']
		};
		set_isFetchingQuote(true);

		const depositTxData = encodeFunctionData({
			abi: parseAbi(config.depositContractAbi),
			functionName: 'deposit',
			args: [config.amount, address]
		});

		const contractCallsQuoteRequest: ContractCallsQuoteRequest = {
			fromChain: config.fromChain,
			fromToken: config.fromToken,
			fromAddress: toAddress(address),
			toChain: config.toChain,
			toToken: config.vaultAsset,
			toAmount: config.amount,
			contractCalls: [
				{
					fromAmount: config.amount,
					fromTokenAddress: config.vaultAsset,
					toContractAddress: config.vaultAddress,
					toContractCallData: depositTxData,
					toContractGasLimit: config.depositGas
				}
			]
		};

		try {
			const contactCallsQuoteResponse = await getContractCallsQuote(contractCallsQuoteRequest);
			if (contactCallsQuoteResponse) {
				set_latestQuote(contactCallsQuoteResponse);
				set_isFetchingQuote(false);
				return contactCallsQuoteResponse;
			}
		} catch (e) {
			console.error(e);
		}
		set_isFetchingQuote(false);
		return null;
	}, [address, configuration?.asset.normalizedBigAmount, configuration?.asset.token, configuration?.opportunity]);

	useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}

		if (configuration.action === 'DEPOSIT' && isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isZapNeededForWithdraw) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && !isBridgeNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isBridgeNeededForWithdraw) {
			return;
		}
		onRetrieveQuote();
	}, [
		configuration.action,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw,
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		onRetrieveQuote
	]);

	/**********************************************************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (!latestQuote || !configuration?.asset.token || !configuration?.opportunity) {
				return zeroNormalizedBN;
			}
			if (configuration.asset.normalizedBigAmount === zeroNormalizedBN) {
				return zeroNormalizedBN;
			}

			if (isEthAddress(configuration?.asset.token.address)) {
				return toNormalizedBN(MAX_UINT_256, 18);
			}

			const key = allowanceKey(
				configuration.opportunity.chainID,
				toAddress(configuration.asset.token.address),
				toAddress(configuration.opportunity.address),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			set_isFetchingAllowance(true);
			const allowance = await readContract(retrieveConfig(), {
				chainId: Number(configuration?.opportunity.chainID),
				abi: erc20Abi,
				address: toAddress(configuration?.asset?.token.address),
				functionName: 'allowance',
				args: [toAddress(address), toAddress(configuration?.opportunity.address)]
			});

			set_isFetchingAllowance(false);

			existingAllowances.current[key] = toNormalizedBN(allowance, configuration?.asset?.token.decimals);
			return existingAllowances.current[key];
		},
		[
			address,
			configuration.asset.normalizedBigAmount,
			configuration.asset.token,
			configuration.opportunity,
			latestQuote
		]
	);

	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && isZapNeededForWithdraw) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && !isBridgeNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isBridgeNeededForWithdraw) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [
		configuration.action,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw,
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		onRetrieveAllowance
	]);

	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			if (!provider) {
				return;
			}

			assert(configuration?.asset.token, 'Input token is not set');
			assert(configuration?.asset.normalizedBigAmount, 'Input amount is not set');
			assert(latestQuote, 'Quote is not fetched');

			const amount = configuration?.asset.normalizedBigAmount.raw;

			try {
				const result = await approveERC20({
					connector: provider,
					chainID: configuration?.asset.token.chainID,
					contractAddress: configuration?.asset.token.address,
					spenderAddress: toAddress(latestQuote?.estimate.approvalAddress),
					amount: amount,
					statusHandler: set_approvalStatus
				});
				if (result.isSuccessful) {
					onSuccess?.();
				}
				onSuccess?.();
				triggerRetreiveAllowance();
				return;
			} catch (error) {
				console.error(error);
				return;
			}
		},
		[
			configuration?.asset.normalizedBigAmount,
			configuration?.asset.token,
			latestQuote,
			provider,
			triggerRetreiveAllowance
		]
	);

	const execute = useCallback(async (): Promise<TTxResponse> => {
		assert(provider, 'Provider is not set');
		assert(latestQuote, 'Quote is not set');
		assert(configuration?.asset.token, 'Input token is not set');
		assert(configuration?.opportunity, 'Output token is not set');
		try {
			set_depositStatus({...defaultTxStatus, pending: true});

			const {value, to, data, maxFeePerGas} = latestQuote?.transactionRequest || {};
			const wagmiProvider = await toWagmiProvider(provider);

			assert(isHex(data), 'Data is not hex');
			assert(wagmiProvider.walletClient, 'Wallet client is not set');

			const hash = await sendTransaction(retrieveConfig(), {
				value: toBigInt(value ?? 0),
				to: toAddress(to),
				data,
				chainId: configuration.asset.token.chainID,
				maxFeePerGas: toBigInt(maxFeePerGas)
			});

			const receipt = await waitForTransactionReceipt(retrieveConfig(), {
				chainId: wagmiProvider.chainId,
				hash
			});

			if (receipt.status === 'success') {
				return {isSuccessful: true, receipt: receipt};
			}
			return {isSuccessful: false};
		} catch (error) {
			console.error(error);
			return {isSuccessful: false};
		}
	}, [configuration.asset.token, configuration?.opportunity, latestQuote, provider]);

	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');

			set_depositStatus({...defaultTxStatus, pending: true});
			const status = await execute();
			if (status.isSuccessful) {
				set_depositStatus({...defaultTxStatus, success: true});
				onSuccess();
			} else {
				set_depositStatus({...defaultTxStatus, error: true});
			}
		},
		[execute, provider]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

		/** Approval part */
		approvalStatus,
		allowance,
		isFetchingAllowance,
		isApproved: isAboveAllowance,
		isDisabled: !approvalStatus.none,
		onApprove,

		isFetchingQuote,
		quote: latestQuote || null
	};
};
