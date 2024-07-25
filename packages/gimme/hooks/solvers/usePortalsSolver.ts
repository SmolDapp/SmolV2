import {useCallback, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import {BaseError, erc20Abi, isHex, zeroAddress} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	assertAddress,
	isEthAddress,
	isZeroAddress,
	MAX_UINT_256,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {type BaseTransaction, TransactionStatus} from '@gnosis.pm/safe-apps-sdk';
import {readContract, sendTransaction, switchChain, waitForTransactionReceipt} from '@wagmi/core';
import {getPortalsApproval, getPortalsTx, getQuote, PORTALS_NETWORK} from '@lib/utils/api.portals';
import {getApproveTransaction} from '@lib/utils/tools.gnosis';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import {isValidPortalsErrorObject} from '../helpers/isValidPortalsErrorObject';
import {useGetIsStablecoin} from '../helpers/useGetIsStablecoin';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TInitSolverArgs} from '@lib/types/solvers';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

export const usePortalsSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useEarnFlow();
	const {sdk} = useSafeAppsSDK();
	const {address, provider} = useWeb3();
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [latestQuote, set_latestQuote] = useState<TPortalsEstimate>();
	const [isFetchingQuote, set_isFetchingQuote] = useState(false);
	const spendAmount = configuration?.asset.normalizedBigAmount?.raw ?? 0n;
	const isAboveAllowance = allowance.raw >= spendAmount;
	const existingAllowances = useRef<TDict<TNormalizedBN>>({});

	const {getIsStablecoin} = useGetIsStablecoin();
	const isStablecoin = getIsStablecoin({
		address: configuration.asset.token?.address,
		chainID: configuration.asset.token?.chainID
	});

	const onRetrieveQuote = useCallback(async () => {
		if (
			!configuration?.asset.token ||
			!configuration?.opportunity ||
			configuration?.asset.normalizedBigAmount === zeroNormalizedBN
		) {
			return;
		}

		const request: TInitSolverArgs = {
			chainID: configuration?.asset.token.chainID,
			version: configuration?.opportunity.version,
			from: toAddress(address),
			inputToken: configuration?.asset.token.address,
			outputToken: configuration?.opportunity.address,
			inputAmount: configuration?.asset.normalizedBigAmount?.raw ?? 0n,
			isDepositing: true,
			stakingPoolAddress: undefined
		};

		set_isFetchingQuote(true);

		const {result, error} = await getQuote(
			request,
			configuration.opportunity.category === 'Stablecoin' ? 0.1 : 0.5
		);
		if (!result) {
			if (error) {
				console.error(error);
			}
			return undefined;
		}
		set_latestQuote(result);
		set_isFetchingQuote(false);

		return result;
	}, [address, configuration?.asset.normalizedBigAmount, configuration?.asset.token, configuration?.opportunity]);

	useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && !isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isZapNeededForWithdraw) {
			return;
		}
		onRetrieveQuote();
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveQuote]);

	/**********************************************************************************************
	 * Retrieve the allowance for the token to be used by the solver. This will be used to
	 * determine if the user should approve the token or not.
	 **********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (!latestQuote || !configuration?.asset.token || !configuration?.opportunity) {
				return zeroNormalizedBN;
			}
			if (configuration.asset.normalizedBigAmount === zeroNormalizedBN) {
				return zeroNormalizedBN;
			}

			const inputToken = configuration?.asset.token.address;
			const outputToken = configuration?.opportunity.address;

			if (isEthAddress(inputToken)) {
				return toNormalizedBN(MAX_UINT_256, 18);
			}

			const key = allowanceKey(
				configuration?.asset.token?.chainID,
				toAddress(inputToken),
				toAddress(outputToken),
				toAddress(address)
			);
			if (existingAllowances.current[key] && !shouldForceRefetch) {
				return existingAllowances.current[key];
			}

			set_isFetchingAllowance(true);

			try {
				const network = PORTALS_NETWORK.get(configuration?.asset.token.chainID);
				const {data: approval} = await getPortalsApproval({
					params: {
						sender: toAddress(address),
						inputToken: `${network}:${toAddress(inputToken)}`,
						inputAmount: toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString()
					}
				});

				if (!approval) {
					throw new Error('Portals approval not found');
				}

				existingAllowances.current[key] = toNormalizedBN(
					toBigInt(approval.context.allowance),
					configuration?.asset.token.decimals
				);

				set_isFetchingAllowance(false);

				return existingAllowances.current[key];
			} catch (err) {
				set_isFetchingAllowance(false);
				return zeroNormalizedBN;
			}
		},
		[
			address,
			configuration.asset.normalizedBigAmount,
			configuration.asset.token,
			configuration?.opportunity,
			latestQuote
		]
	);

	/**********************************************************************************************
	 * SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 * is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
	const triggerRetreiveAllowance = useAsyncTrigger(async (): Promise<void> => {
		if (!configuration?.action) {
			return;
		}
		if (configuration.action === 'DEPOSIT' && !isZapNeededForDeposit) {
			return;
		}
		if (configuration.action === 'WITHDRAW' && !isZapNeededForWithdraw) {
			return;
		}
		set_allowance(await onRetrieveAllowance(true));
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveAllowance]);

	/**********************************************************************************************
	 * Trigger an signature to approve the token to be used by the Portals
	 * solver. A single signature is required, which will allow the spending
	 * of the token by the Portals solver.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			if (!provider) {
				return;
			}

			assert(configuration?.asset.token, 'Input token is not set');
			assert(configuration?.asset.normalizedBigAmount, 'Input amount is not set');

			const amount = configuration?.asset.normalizedBigAmount.raw;

			try {
				const network = PORTALS_NETWORK.get(configuration?.asset.token.chainID);
				const {data: approval} = await getPortalsApproval({
					params: {
						sender: toAddress(address),
						inputToken: `${network}:${toAddress(configuration?.asset.token.address)}`,
						inputAmount: toBigInt(configuration?.asset.normalizedBigAmount.raw).toString()
					}
				});

				if (!approval) {
					return;
				}

				const allowance = await readContract(retrieveConfig(), {
					chainId: Number(configuration?.opportunity?.chainID),
					abi: erc20Abi,
					address: toAddress(configuration?.asset?.token.address),
					functionName: 'allowance',
					args: [toAddress(address), toAddress(approval.context.spender)]
				});

				if (allowance < amount) {
					assertAddress(approval.context.spender, 'spender');
					const result = await approveERC20({
						connector: provider,
						chainID: configuration?.asset.token.chainID,
						contractAddress: configuration?.asset.token.address,
						spenderAddress: approval.context.spender,
						amount: amount,
						statusHandler: set_approvalStatus
					});
					if (result.isSuccessful) {
						onSuccess?.();
					}
					triggerRetreiveAllowance();
					return;
				}
				onSuccess?.();
				triggerRetreiveAllowance();
				return;
			} catch (error) {
				console.error(error);
				return;
			}
		},
		[address, configuration, provider, triggerRetreiveAllowance]
	);

	/**********************************************************************************************
	 * execute will send the post request to execute the order and wait for it to be executed, no
	 * matter the result. It returns a boolean value indicating whether the order was successful or
	 * not.
	 *********************************************************************************************/
	const execute = useCallback(async (): Promise<TTxResponse> => {
		assert(provider, 'Provider is not set');
		assert(latestQuote, 'Quote is not set');
		assert(configuration?.asset.token, 'Input token is not set');
		assert(configuration?.opportunity, 'Output token is not set');

		try {
			let inputToken = configuration?.asset.token.address;
			const outputToken = configuration?.opportunity.address;
			if (isEthAddress(inputToken)) {
				inputToken = zeroAddress;
			}
			const network = PORTALS_NETWORK.get(configuration?.asset.token.chainID);
			const transaction = await getPortalsTx({
				params: {
					sender: toAddress(address),
					inputToken: `${network}:${toAddress(inputToken)}`,
					outputToken: `${network}:${toAddress(outputToken)}`,
					inputAmount: toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(),
					slippageTolerancePercentage: isStablecoin ? String(0.1) : String(1),
					// TODO figure out what slippage do we need
					validate: 'false'
				}
			});

			if (!transaction.result) {
				throw new Error('Transaction data was not fetched from Portals!');
			}

			const {
				tx: {value, to, data, ...rest}
			} = transaction.result;
			const wagmiProvider = await toWagmiProvider(provider);

			if (wagmiProvider.chainId !== configuration?.asset.token.chainID) {
				try {
					await switchChain(retrieveConfig(), {chainId: configuration?.asset.token.chainID});
				} catch (error) {
					if (!(error instanceof BaseError)) {
						return {isSuccessful: false, error};
					}
					console.error(error.shortMessage);

					return {isSuccessful: false, error};
				}
			}

			assert(isHex(data), 'Data is not hex');
			assert(wagmiProvider.walletClient, 'Wallet client is not set');
			const hash = await sendTransaction(retrieveConfig(), {
				value: toBigInt(value ?? 0),
				to: toAddress(to),
				data,
				chainId: configuration?.asset.token.chainID,
				...rest
			});
			const receipt = await waitForTransactionReceipt(retrieveConfig(), {
				chainId: wagmiProvider.chainId,
				hash
			});
			if (receipt.status === 'success') {
				return {isSuccessful: true, receipt: receipt};
			}
			console.error('Fail to perform transaction');
			return {isSuccessful: false};
		} catch (error) {
			if (isValidPortalsErrorObject(error)) {
				const errorMessage = error.response.data.message;
				console.error(errorMessage);
			} else {
				console.error(error);
			}

			return {isSuccessful: false};
		}
	}, [
		address,
		configuration?.asset.normalizedBigAmount?.raw,
		configuration?.asset.token,
		configuration?.opportunity,
		isStablecoin,
		latestQuote,
		provider
	]);

	/**********************************************************************************************
	 * This execute function is not an actual deposit/withdraw, but a swap using the Portals
	 * solver. The deposit will be executed by the Portals solver by simply swapping the input token
	 * for the output token.
	 *********************************************************************************************/
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

	const onExecuteForGnosis = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(provider, 'Provider is not set');
			assert(latestQuote, 'Quote is not set');
			assert(configuration?.asset.token, 'Input token is not set');
			assert(configuration?.opportunity, 'Output token is not set');

			let inputToken = configuration?.asset.token.address;
			const outputToken = configuration?.opportunity.address;
			if (isEthAddress(inputToken)) {
				inputToken = zeroAddress;
			}

			const network = PORTALS_NETWORK.get(configuration?.asset.token.chainID);
			const transaction = await getPortalsTx({
				params: {
					sender: toAddress(address),
					inputToken: `${network}:${toAddress(inputToken)}`,
					outputToken: `${network}:${toAddress(outputToken)}`,
					inputAmount: toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(),
					slippageTolerancePercentage: isStablecoin ? String(0.1) : String(1),
					// TODO figure out what slippage do we need
					validate: 'false'
				}
			});

			if (!transaction.result) {
				throw new Error('Transaction data was not fetched from Portals!');
			}

			const {
				tx: {value, to, data}
			} = transaction.result;

			const batch = [];

			if (!isZeroAddress(inputToken)) {
				const approveTransactionForBatch = getApproveTransaction(
					toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(),
					toAddress(configuration.asset.token?.address),
					toAddress(to)
				);

				batch.push(approveTransactionForBatch);
			}

			const portalsTransactionForBatch: BaseTransaction = {
				to: toAddress(to),
				value: toBigInt(value ?? 0).toString(),
				data
			};
			batch.push(portalsTransactionForBatch);

			try {
				const res = await sdk.txs.send({txs: batch});
				let result;
				do {
					if (
						result?.txStatus === TransactionStatus.CANCELLED ||
						result?.txStatus === TransactionStatus.FAILED
					) {
						throw new Error('An error occured while creating your transaction!');
					}

					result = await sdk.txs.getBySafeTxHash(res.safeTxHash);
					await new Promise(resolve => setTimeout(resolve, 30_000));
				} while (result.txStatus !== TransactionStatus.SUCCESS);
				onSuccess?.();
			} catch (error) {
				toast.error((error as BaseError)?.message || 'An error occured while creating your transaction!');
			}
		},
		[
			address,
			configuration.asset.normalizedBigAmount?.raw,
			configuration.asset.token,
			configuration.opportunity,
			isStablecoin,
			latestQuote,
			provider,
			sdk.txs
		]
	);

	return {
		/** Deposit part */
		depositStatus,
		set_depositStatus,
		onExecuteDeposit,

		onExecuteForGnosis,

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
