import {useCallback, useMemo, useRef, useState} from 'react';
import toast from 'react-hot-toast';
import {encodeFunctionData, erc20Abi} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {
	assert,
	isAddress,
	isEthAddress,
	toAddress,
	toBigInt,
	toNormalizedBN,
	zeroNormalizedBN
} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';
import {useSafeAppsSDK} from '@gnosis.pm/safe-apps-react-sdk';
import {TransactionStatus} from '@gnosis.pm/safe-apps-sdk';
import {readContract} from '@wagmi/core';
import {isSupportingPermit, signPermit} from '@lib/hooks/usePermit';
import {YEARN_4626_ROUTER_ABI} from '@lib/utils/abi/yearn4626Router.abi';
import {deposit, depositViaRouter} from '@lib/utils/actions';
import {CHAINS} from '@lib/utils/tools.chains';
import {getApproveTransaction, getDepositTransaction} from '@lib/utils/tools.gnosis';
import {allowanceKey} from '@yearn-finance/web-lib/utils/helpers';

import type {TSolverContextBase} from 'packages/gimme/contexts/useSolver';
import type {BaseError} from 'viem';
import type {TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TTxResponse} from '@builtbymom/web3/utils/wagmi';
import type {TPermitSignature} from '@lib/hooks/usePermit.types';

export const useVanilaSolver = (
	isZapNeededForDeposit: boolean,
	isZapNeededForWithdraw: boolean
): TSolverContextBase => {
	const {configuration} = useEarnFlow();
	const {provider, address} = useWeb3();
	const {sdk} = useSafeAppsSDK();

	const [isFetchingAllowance, set_isFetchingAllowance] = useState(false);
	const [approvalStatus, set_approvalStatus] = useState(defaultTxStatus);
	const [depositStatus, set_depositStatus] = useState(defaultTxStatus);
	const [allowance, set_allowance] = useState<TNormalizedBN>(zeroNormalizedBN);
	const [permitSignature, set_permitSignature] = useState<TPermitSignature | undefined>(undefined);
	const existingAllowances = useRef<TDict<TNormalizedBN>>({});
	const isAboveAllowance = allowance.raw >= configuration.asset.normalizedBigAmount.raw;

	/**********************************************************************************************
	 ** The isV3Vault hook is used to determine if the current vault is a V3 vault. It's very
	 ** important to know if the vault is a V3 vault because the deposit and withdraw functions
	 ** are different for V3 vaults, and only V3 vaults support the permit signature.
	 *********************************************************************************************/
	const isV3Vault = useMemo(
		() => configuration?.opportunity?.version.split('.')?.[0] === '3',
		[configuration?.opportunity]
	);

	/**********************************************************************************************
	 ** Retrieve the allowance for the token to be used by the solver. This will
	 ** be used to determine if the user should approve the token or not.
	 *********************************************************************************************/
	const onRetrieveAllowance = useCallback(
		async (shouldForceRefetch?: boolean): Promise<TNormalizedBN> => {
			if (
				!configuration.asset.token ||
				!configuration.opportunity ||
				!provider ||
				isEthAddress(configuration.asset.token.address)
			) {
				return zeroNormalizedBN;
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
		[address, configuration?.asset.token, configuration?.opportunity, provider]
	);

	/**********************************************************************************************
	 ** SWR hook to get the expected out for a given in/out pair with a specific amount. This hook
	 ** is called when amount/in or out changes. Calls the allowanceFetcher callback.
	 *********************************************************************************************/
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
		set_allowance(await onRetrieveAllowance(false));
	}, [configuration.action, isZapNeededForDeposit, isZapNeededForWithdraw, onRetrieveAllowance]);

	/**********************************************************************************************
	 ** Trigger an approve web3 action, simply trying to approve `amount` tokens
	 ** to be used by the final vault, in charge of depositing the tokens.
	 ** This approve can not be triggered if the wallet is not active
	 ** (not connected) or if the tx is still pending.
	 *********************************************************************************************/
	const onApprove = useCallback(
		async (onSuccess?: () => void): Promise<void> => {
			assert(configuration?.asset.token, 'Input token is not set');
			assert(configuration?.opportunity, 'Output token is not set');

			const shouldUsePermit = await isSupportingPermit({
				contractAddress: configuration.asset.token.address,
				chainID: configuration.opportunity.chainID
			});
			try {
				if (
					shouldUsePermit &&
					isV3Vault &&
					isAddress(CHAINS[configuration.opportunity.chainID].yearnRouterAddress)
				) {
					const signResult = await signPermit({
						contractAddress: configuration.asset.token.address,
						ownerAddress: toAddress(address),
						spenderAddress: toAddress(CHAINS[configuration.opportunity.chainID].yearnRouterAddress),
						value: configuration.asset.normalizedBigAmount?.raw || 0n,
						deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 60), // 60 minutes
						chainID: configuration.opportunity.chainID
					});
					if (signResult?.signature) {
						set_approvalStatus({...approvalStatus, success: true});
						set_allowance(configuration.asset.normalizedBigAmount || zeroNormalizedBN);
						set_permitSignature(signResult);
						onSuccess?.();
					} else {
						set_approvalStatus({...approvalStatus, error: true});
						throw new Error('Error signing a permit for a given token using the specified parameters.');
					}
				} else {
					const result = await approveERC20({
						connector: provider,
						chainID: configuration.opportunity.chainID,
						contractAddress: configuration.asset.token.address,
						spenderAddress: configuration.opportunity.address,
						amount: configuration.asset.normalizedBigAmount?.raw || 0n,
						statusHandler: set_approvalStatus
					});
					set_allowance(await onRetrieveAllowance(true));
					if (result.isSuccessful) {
						onSuccess?.();
					}
				}
			} catch (error) {
				if (permitSignature) {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				}
				set_approvalStatus({...defaultTxStatus, error: true});

				toast.error((error as BaseError)?.message || 'An error occured while creating your transaction!');
			}
		},
		[
			configuration.asset.token,
			configuration.asset.normalizedBigAmount,
			configuration.opportunity,
			isV3Vault,
			address,
			approvalStatus,
			provider,
			onRetrieveAllowance,
			permitSignature
		]
	);

	const onExecuteForGnosis = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			const approveTransactionForBatch = getApproveTransaction(
				toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(),
				toAddress(configuration.asset.token?.address),
				toAddress(configuration.opportunity?.address)
			);

			const depositTransactionForBatch = getDepositTransaction(
				toAddress(configuration.opportunity?.address),
				toBigInt(configuration?.asset.normalizedBigAmount?.raw).toString(),
				toAddress(address)
			);

			set_depositStatus({...defaultTxStatus, pending: true});

			try {
				const res = await sdk.txs.send({txs: [approveTransactionForBatch, depositTransactionForBatch]});
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

				set_depositStatus({...defaultTxStatus, success: true});
				onSuccess?.();
			} catch (error) {
				set_depositStatus({...defaultTxStatus, error: true});
				toast.error((error as BaseError)?.message || 'An error occured while creating your transaction!');
			} finally {
				if (permitSignature) {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				}
			}
		},
		[
			address,
			configuration.asset.normalizedBigAmount?.raw,
			configuration.asset.token?.address,
			configuration.opportunity?.address,
			permitSignature,
			sdk.txs
		]
	);

	/**********************************************************************************************
	 ** Trigger a deposit web3 action, simply trying to deposit `amount` tokens to
	 ** the selected vault.
	 *********************************************************************************************/
	const onExecuteDeposit = useCallback(
		async (onSuccess: () => void): Promise<void> => {
			assert(configuration?.opportunity?.address, 'Output token is not set');
			assert(configuration?.asset?.token?.address, 'Input amount is not set');
			set_depositStatus({...defaultTxStatus, pending: true});

			let result: TTxResponse | undefined = undefined;
			try {
				if (permitSignature) {
					result = await depositViaRouter({
						connector: provider,
						statusHandler: set_depositStatus,
						chainID: configuration.opportunity?.chainID,
						contractAddress: toAddress(CHAINS[configuration.opportunity.chainID].yearnRouterAddress),
						amount: toBigInt(configuration.asset.normalizedBigAmount.raw),
						token: toAddress(configuration.asset.token.address),
						vault: toAddress(configuration.opportunity.address),
						permitCalldata: encodeFunctionData({
							abi: YEARN_4626_ROUTER_ABI,
							functionName: 'selfPermit',
							args: [
								toAddress(configuration.asset.token.address),
								toBigInt(configuration.asset.normalizedBigAmount.raw),
								permitSignature.deadline,
								permitSignature.v,
								permitSignature.r,
								permitSignature.s
							]
						})
					});
				} else {
					result = await deposit({
						connector: provider,
						chainID: configuration?.opportunity?.chainID,
						contractAddress: toAddress(configuration?.opportunity?.address),
						amount: toBigInt(configuration?.asset?.normalizedBigAmount?.raw),
						statusHandler: set_depositStatus
					});
					onRetrieveAllowance(true);
				}

				if (result.isSuccessful) {
					onSuccess();
					set_depositStatus({...defaultTxStatus, success: true});
					return;
				}
				set_depositStatus({...defaultTxStatus, error: true});
			} catch (error) {
				toast.error((error as BaseError).shortMessage || 'An error occured while creating your transaction!');
				console.error(error);
			} finally {
				if (permitSignature) {
					set_permitSignature(undefined);
					set_allowance(zeroNormalizedBN);
				}
			}
		},
		[
			configuration.asset.normalizedBigAmount.raw,
			configuration.asset.token?.address,
			configuration.opportunity?.address,
			configuration.opportunity?.chainID,
			onRetrieveAllowance,
			permitSignature,
			provider
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

		isFetchingQuote: false,
		quote: null
	};
};
