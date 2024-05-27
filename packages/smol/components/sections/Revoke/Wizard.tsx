import {type ReactElement} from 'react';
import {ErrorModal} from 'packages/lib/common/ErrorModal';
import {SuccessModal} from 'packages/lib/common/SuccessModal';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';

import {useAllowances} from './useAllowances';

import type {TRevokeWizardProps} from '@lib/types/Revoke';

export const RevokeWizard = (props: TRevokeWizardProps): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();

	/**********************************************************************************************
	 ** A function that lets us to set transaction status to default while closing modals.
	 *********************************************************************************************/
	const onCloseModal = (): void => {
		props.set_revokeStatus(defaultTxStatus);
		dispatchConfiguration({type: 'SET_ALLOWANCE_TO_REVOKE', payload: undefined});
	};

	return (
		<>
			<ErrorModal
				isOpen={props.revokeStatus.error}
				onClose={onCloseModal}
				title={'Error'}
				content={'An error occured while revoking  your token, please try again.'}
				ctaLabel={'Close'}
			/>

			<SuccessModal
				isOpen={props.revokeStatus.success}
				onClose={onCloseModal}
				title={'It looks like a success!'}
				content={`${configuration.tokenToRevoke?.name} token has successfully revoked on ${configuration.tokenToRevoke?.spender} contract`}
				ctaLabel={'Close'}
			/>
		</>
	);
};
