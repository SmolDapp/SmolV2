import React, {useState} from 'react';
import {usePlausible} from 'next-plausible';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {isEthAddress, isZeroAddress, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {ErrorModal} from '@lib/common/ErrorModal';
import {SuccessModal} from '@lib/common/SuccessModal';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {TWEETER_SHARE_CONTENT} from '@lib/utils/twitter';

import {useSend} from './useSend';
import {useSendFlow} from './useSendFlow';

import type {ReactElement} from 'react';

export function SendWizard({isReceiverERC20}: {isReceiverERC20: boolean}): ReactElement {
	const {chainID} = useChainID();
	const {address} = useWeb3();
	const {configuration, dispatchConfiguration} = useSendFlow();
	const [migrateStatus, set_migrateStatus] = useState(defaultTxStatus);
	const {migratedTokens, onHandleMigration} = useSend(undefined, undefined, set_migrateStatus);

	const plausible = usePlausible();

	const isSendButtonDisabled =
		isZeroAddress(configuration.receiver?.address) ||
		isEthAddress(configuration.receiver.address) ||
		configuration.inputs.some(input => input.token && input.normalizedBigAmount.raw === toBigInt(0)) ||
		!configuration.inputs.every(input => input.isValid === true) ||
		isReceiverERC20;

	const errorModalContent =
		migratedTokens.length === 0
			? 'No tokens were sent, please try again.'
			: `${migratedTokens.map(token => token.token?.name).join(', ')} ${migratedTokens.length === 1 ? 'was' : 'were'} sent, please retry the rest.`;

	const onMigration = (): void => {
		onHandleMigration();
		plausible(PLAUSIBLE_EVENTS.SEND_TOKENS, {
			props: {
				sendChainID: chainID,
				sendTo: toAddress(configuration.receiver?.address),
				sendFrom: toAddress(address)
			}
		});
	};

	return (
		<>
			<Button
				className={'!h-8 w-full max-w-[240px] !text-xs'}
				isBusy={migrateStatus.pending}
				isDisabled={isSendButtonDisabled}
				onClick={onMigration}>
				<b>{'Send'}</b>
			</Button>
			<SuccessModal
				title={'Success!'}
				content={
					'Like a fancy bird, your tokens have migrated! They are moving to their new home, with their new friends.'
				}
				twitterShareContent={TWEETER_SHARE_CONTENT.SEND}
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
