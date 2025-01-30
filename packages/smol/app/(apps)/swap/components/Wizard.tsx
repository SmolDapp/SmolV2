import {SuccessModal} from '@lib/common/SuccessModal';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import Link from 'next/link';
import React, {useCallback, useState} from 'react';

import {IconAppSwap} from '@lib/icons/IconApps';
import {Button} from '@lib/primitives/Button';
import {cl, truncateHexTx} from '@lib/utils/helpers';
import {formatAmount, toNormalizedBN} from '@lib/utils/numbers';
import {toAddress} from '@lib/utils/tools.addresses';
import {defaultTxStatus} from '@lib/utils/tools.transactions';
import {TWEETER_SHARE_CONTENT} from '@lib/utils/twitter';
import {useSwapFlow} from 'packages/smol/app/(apps)/swap/contexts/useSwapFlow.lifi';

import type {TTxStatus} from '@lib/utils/tools.transactions';
import type {TLifiStatusResponse} from 'packages/smol/app/(apps)/swap/utils/api.lifi';
import type {ReactElement} from 'react';

function SendSuccessModal(props: {
	swapStatus: TTxStatus & {data?: TLifiStatusResponse};
	onClose: VoidFunction;
}): ReactElement {
	if (!props.swapStatus.data) {
		return (
			<SuccessModal
				title={'Success!'}
				content={
					<div className={'w-full p-4 text-left'}>
						<p className={'text-center'}>
							{
								'Looks like your swap has been successfully processed. What an adventure we’ve been on together anon. The highs, the lows, the swapping… we’ve enjoyed every moment of it!'
							}
						</p>
					</div>
				}
				twitterShareContent={TWEETER_SHARE_CONTENT.SWAP}
				ctaLabel={'Close'}
				isOpen={props.swapStatus.success}
				onClose={props.onClose}
			/>
		);
	}

	const {data} = props.swapStatus;
	return (
		<SuccessModal
			title={'Success!'}
			content={
				<div className={'w-full rounded-md bg-neutral-400/40 p-4 text-left'}>
					<p className={'text-center'}>
						{
							'Looks like your swap has been successfully processed. What an adventure we’ve been on together anon. The highs, the lows, the swapping… we’ve enjoyed every moment of it!'
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
									{truncateHexTx(toAddress(data.toAddress), 8)}
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
			twitterShareContent={TWEETER_SHARE_CONTENT.SWAP}
			ctaLabel={'Close'}
			isOpen={props.swapStatus.success}
			onClose={props.onClose}
		/>
	);
}

export function SendWizard(): ReactElement {
	const {
		input,
		hasSolverAllowance,
		approveSolverSpender,
		performSolverSwap,
		isValid,
		estimatedTime,
		retrieveExpectedOut,
		reset
	} = useSwapFlow();
	const [approveStatus, setApproveStatus] = useState(defaultTxStatus);
	const [swapStatus, setSwapStatus] = useState<TTxStatus & {data?: TLifiStatusResponse}>({...defaultTxStatus});
	const [hasEnoughAllowance, setHasEnoughAllowance] = useState(false);

	const onHandleSwap = useCallback(async (): Promise<void> => {
		await performSolverSwap(setSwapStatus);
	}, [performSolverSwap]);

	/**********************************************************************************************
	 ** This trigger is used to check if the user has enough allowance to perform the swap. It will
	 ** trigger a refresh when the hasSolverAllowance changes, and it will check if the user has
	 ** enough allowance to perform the swap.
	 *********************************************************************************************/
	const refreshSolverAllowance = useAsyncTrigger(async (): Promise<void> => {
		const hasAllowance = await hasSolverAllowance();
		setHasEnoughAllowance(hasAllowance);
	}, [hasSolverAllowance]);

	/**********************************************************************************************
	 ** The onHandleApprove function is called when the user clicks the approve button. It will
	 ** approve the spender for the token if the user has not already done so. If the user has
	 ** already approved the spender, this function should not be callable.
	 *********************************************************************************************/
	const onHandleApprove = useCallback(async (): Promise<void> => {
		await approveSolverSpender(setApproveStatus);
		await refreshSolverAllowance();
		await performSolverSwap(setSwapStatus);
	}, [approveSolverSpender, performSolverSwap, refreshSolverAllowance]);

	const isSendButtonDisabled = input.normalizedBigAmount.raw === 0n || !input.isValid || !isValid;

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
						isBusy={approveStatus.pending || swapStatus.pending}
						isDisabled={isSendButtonDisabled}
						onClick={onHandleApprove}>
						<b>{'Approve and swap'}</b>
					</Button>
				)}
				<div>
					<button
						onClick={async () => retrieveExpectedOut(true)}
						className={cl(
							'hover:bg-primaryHover group rounded-lg bg-neutral-300 p-2 text-neutral-600',
							'transition-all hover:scale-110',
							estimatedTime ? 'opacity-100' : 'opacity-0 pointer-events-none'
						)}>
						<IconAppSwap className={'size-4 transition-colors group-hover:text-black'} />
					</button>
				</div>
			</div>
			<SendSuccessModal
				swapStatus={swapStatus}
				onClose={(): void => {
					reset();
					setSwapStatus(defaultTxStatus);
				}}
			/>
		</>
	);
}
