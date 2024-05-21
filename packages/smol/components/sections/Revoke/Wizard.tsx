import {ErrorModal} from 'packages/lib/common/ErrorModal';
import {SuccessModal} from 'packages/lib/common/SuccessModal';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';

import {useAllowances} from './useAllowances';

import type {Dispatch, ReactElement, SetStateAction} from 'react';

type TRevokeWizardProps = {
	revokeStatus: {
		none: boolean;
		pending: boolean;
		success: boolean;
		error: boolean;
	};
	set_revokeStatus: Dispatch<
		SetStateAction<{
			none: boolean;
			pending: boolean;
			success: boolean;
			error: boolean;
		}>
	>;
};

export const RevokeWizard = (props: TRevokeWizardProps): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();

	return (
		<>
			<ErrorModal
				isOpen={props.revokeStatus.error}
				onClose={(): void => {
					props.set_revokeStatus(defaultTxStatus);
					dispatchConfiguration({type: 'SET_TOKEN_TO_REVOKE', payload: undefined});
				}}
				title={'Error'}
				content={'An error occured while revoking  your token, please try again.'}
				ctaLabel={'Close'}
			/>

			<SuccessModal
				isOpen={props.revokeStatus.success}
				onClose={(): void => {
					props.set_revokeStatus(defaultTxStatus);
					dispatchConfiguration({type: 'SET_TOKEN_TO_REVOKE', payload: undefined});
				}}
				title={'It looks like a success!'}
				content={`${configuration.tokenToRevoke?.name} token has successfully revoked on ${configuration.tokenToRevoke?.spender} contract`}
				ctaLabel={'Close'}
			/>
		</>
	);
};
