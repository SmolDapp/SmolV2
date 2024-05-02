import React, {useCallback, useState} from 'react';
import Link from 'next/link';
import {Button} from 'components/Primitives/Button';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {formatAmount, toAddress, toBigInt, toNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {truncateHexTx} from '@utils/helpers';
import {SuccessModal} from '@common/SuccessModal';

import {useSwapFlow} from './useSwapFlow.lifi';

import type {ReactElement} from 'react';
import type {TTxStatus} from '@builtbymom/web3/utils/wagmi';
import type {TLifiStatusResponse} from './api.lifi';

function SendSuccessModal(props: {
	swapStatus: TTxStatus & {data?: TLifiStatusResponse};
	onClose: VoidFunction;
}): ReactElement {
	if (!props.swapStatus.data) {
		return (
			<SuccessModal
				title={'It looks like a success!'}
				content={
					<div className={'w-full p-4 text-left'}>
						<p className={'text-center'}>
							{
								'We are really happy to inform you that your transaction has been successfully processed! This was an adventure, an unforgettable journey. We hope you enjoyed it as much as we did!'
							}
						</p>
					</div>
				}
				ctaLabel={'Close'}
				isOpen={props.swapStatus.success}
				onClose={props.onClose}
			/>
		);
	}

	const {data} = props.swapStatus;
	return (
		<SuccessModal
			title={'It looks like a success!'}
			content={
				<div className={'w-full rounded-md bg-neutral-400/40 p-4 text-left'}>
					<p className={'text-center'}>
						{
							'We are really happy to inform you that your transaction has been successfully processed! This was an adventure, an unforgettable journey. We hope you enjoyed it as much as we did!'
						}
					</p>
					<div className={'mt-4 flex flex-col gap-0 border-t border-dashed border-neutral-600/60 pt-4'}>
						<div className={'flex w-full items-center justify-between'}>
							<p className={'text-sm text-neutral-900/60'}>{'Sold'}</p>
							<p className={'font-mono text-sm'}>
								{`${formatAmount(toNormalizedBN(data.sending.amount, data.sending.token.decimals).normalized, 6)} `}
								<Link
									href={`${data.sending.txLink.split('/tx/')[0]}/address/${data.sending.token.address}`}
									target={'_blank'}>
									<span className={'cursor-alias font-mono text-sm hover:underline'}>
										{data.sending.token.symbol}
									</span>
								</Link>
							</p>
						</div>
						<div className={'flex w-full items-center justify-between'}>
							<p className={'text-sm text-neutral-900/60'}>{'Received'}</p>
							<p className={'font-mono text-sm'}>
								{`${formatAmount(toNormalizedBN(data.receiving.amount, data.receiving.token.decimals).normalized, 6)} `}
								<Link
									href={`${data.receiving.txLink.split('/tx/')[0]}/address/${data.receiving.token.address}`}
									target={'_blank'}>
									<span className={'cursor-alias font-mono text-sm hover:underline'}>
										{data.receiving.token.symbol}
									</span>
								</Link>
							</p>
						</div>
						<div className={'flex w-full items-center justify-between'}>
							<p className={'text-sm text-neutral-900/60'}>{'Receiver'}</p>
							<Link
								href={`${data.receiving.txLink.split('/tx/')[0]}/address/${data.toAddress}`}
								target={'_blank'}>
								<p className={'cursor-alias font-mono text-sm hover:underline'}>
									{toAddress(data.toAddress)}
								</p>
							</Link>
						</div>
						<div className={'flex w-full items-center justify-between'}>
							<p className={'text-sm text-neutral-900/60'}>{'Transaction'}</p>
							<Link
								href={data.lifiExplorerLink}
								target={'_blank'}>
								<p className={'cursor-alias font-mono text-sm hover:underline'}>
									{truncateHexTx(data.sending.txHash, 8)}
								</p>
							</Link>
						</div>
					</div>
				</div>
			}
			ctaLabel={'Close'}
			isOpen={props.swapStatus.success}
			onClose={props.onClose}
		/>
	);
}

export function SendWizard(): ReactElement {
	const {configuration, dispatchConfiguration, hasSolverAllowance, approveSolverSpender, performSolverSwap, isValid} =
		useSwapFlow();
	const [approveStatus, set_approveStatus] = useState(defaultTxStatus);
	const [swapStatus, set_swapStatus] = useState<TTxStatus & {data?: TLifiStatusResponse}>({...defaultTxStatus});
	const [hasEnoughAllowance, set_hasEnoughAllowance] = useState(false);

	const onHandleSwap = useCallback(async (): Promise<void> => {
		const hasBeenExecuted = await performSolverSwap(set_swapStatus);
		console.warn({hasBeenExecuted});
	}, [performSolverSwap]);

	/**********************************************************************************************
	 ** This trigger is used to check if the user has enough allowance to perform the swap. It will
	 ** trigger a refresh when the hasSolverAllowance changes, and it will check if the user has
	 ** enough allowance to perform the swap.
	 *********************************************************************************************/
	const refreshSolverAllowance = useAsyncTrigger(async (): Promise<void> => {
		const hasAllowance = await hasSolverAllowance();
		set_hasEnoughAllowance(hasAllowance);
	}, [hasSolverAllowance]);

	/**********************************************************************************************
	 ** The onHandleApprove function is called when the user clicks the approve button. It will
	 ** approve the spender for the token if the user has not already done so. If the user has
	 ** already approved the spender, this function should not be callable.
	 *********************************************************************************************/
	const onHandleApprove = useCallback(async (): Promise<void> => {
		await approveSolverSpender(set_approveStatus);
		refreshSolverAllowance();
	}, [approveSolverSpender, refreshSolverAllowance]);

	const isSendButtonDisabled =
		configuration.input.normalizedBigAmount.raw === toBigInt(0) || !configuration.input.isValid || !isValid;

	return (
		<>
			<div className={'flex flex-row items-center gap-2'}>
				{hasEnoughAllowance ? (
					<Button
						className={'!h-8 w-full max-w-[240px] !text-xs'}
						isBusy={swapStatus.pending}
						isDisabled={isSendButtonDisabled}
						onClick={onHandleSwap}>
						<b>{'Swap'}</b>
					</Button>
				) : (
					<Button
						className={'!h-8 w-full max-w-[240px] !text-xs'}
						isBusy={approveStatus.pending}
						isDisabled={isSendButtonDisabled}
						onClick={onHandleApprove}>
						<b>{'Approve'}</b>
					</Button>
				)}
			</div>
			<SendSuccessModal
				swapStatus={swapStatus}
				onClose={(): void => {
					dispatchConfiguration({type: 'RESET', payload: undefined});
					set_swapStatus(defaultTxStatus);
				}}
			/>
		</>
	);
}
