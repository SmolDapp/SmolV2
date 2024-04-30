import React, {useCallback, useState} from 'react';
import {Button} from 'components/Primitives/Button';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {SuccessModal} from '@common/SuccessModal';

import {useSwapFlow} from './useSwapFlow.lifi';

import type {ReactElement} from 'react';

export function SendWizard(): ReactElement {
	const {configuration, dispatchConfiguration, hasSolverAllowance, approveSolverSpender, performSolverSwap, isValid} =
		useSwapFlow();
	const [approveStatus, set_approveStatus] = useState(defaultTxStatus);
	const [swapStatus, set_swapStatus] = useState(defaultTxStatus);
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
			<SuccessModal
				title={'It looks like a success!'}
				content={
					'Like a fancy bird, your tokens have migrated! They are moving to their new home, with their new friends.'
				}
				ctaLabel={'Close'}
				isOpen={swapStatus.success}
				onClose={(): void => {
					dispatchConfiguration({type: 'RESET', payload: undefined});
					set_swapStatus(defaultTxStatus);
				}}
			/>
		</>
	);
}
