import {useCallback, useState} from 'react';
import {erc20Abi, isAddressEqual} from 'viem';
import {useWriteContract} from 'wagmi';
import {toAddress} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {usdtAbi, usdtAddress} from '@utils/abi/usdtAbi';
import {ErrorModal} from '@common/ErrorModal';
import {SuccessModal} from '@common/SuccessModal';

import {AllowancesTable} from './AllowancesTable';
import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {Abi} from 'viem';
import type {TAddress, TToken} from '@builtbymom/web3/types';

export type TTokenToRevoke = Pick<TToken, 'address' | 'name'> & {spender?: TAddress};

export const RevokeWizard = (): ReactElement => {
	const [revokeStatus, set_revokeStatus] = useState(defaultTxStatus);

	const {writeContract} = useWriteContract();

	const {refreshApproveEvents, dispatchConfiguration, configuration} = useAllowances();
	const onRevokeSuccess = useCallback(
		(tokenAddress: TAddress[] | undefined): void => {
			set_revokeStatus({...defaultTxStatus, success: true});
			if (!tokenAddress) {
				return;
			}
			refreshApproveEvents(tokenAddress);
		},
		[refreshApproveEvents]
	);

	const revokeTokenAllowance = useCallback(
		(tokenToRevoke: TTokenToRevoke, spender: TAddress): void => {
			dispatchConfiguration({type: 'SET_TOKEN_TO_REVOKE', payload: {...tokenToRevoke, spender}});

			writeContract(
				{
					address: toAddress(tokenToRevoke.address),
					abi: isAddressEqual(tokenToRevoke.address, usdtAddress) ? (usdtAbi as Abi) : erc20Abi,
					functionName: 'approve',
					args: [spender, 0n]
				},
				{
					onSuccess: () => onRevokeSuccess(configuration.tokensToCheck?.map(item => item.address)),
					onError: error => {
						set_revokeStatus({...defaultTxStatus, error: true});
						console.log(error);
					}
				}
			);
		},
		[configuration.tokensToCheck, dispatchConfiguration, onRevokeSuccess, writeContract]
	);

	return (
		<>
			<AllowancesTable revoke={revokeTokenAllowance} />

			<ErrorModal
				isOpen={revokeStatus.error}
				onClose={(): void => {
					set_revokeStatus(defaultTxStatus);
				}}
				title={'Error'}
				content={'An error occured while revoking  your token, please try again.'}
				ctaLabel={'Close'}
			/>

			<SuccessModal
				isOpen={revokeStatus.success}
				onClose={(): void => {
					set_revokeStatus(defaultTxStatus);
					dispatchConfiguration({type: 'SET_TOKEN_TO_REVOKE', payload: undefined});
				}}
				title={'It looks like a success!'}
				content={`${configuration.tokenToRevoke?.name} token has successfully revoked on ${configuration.tokenToRevoke?.spender} contract`}
				ctaLabel={'Close'}
			/>
		</>
	);
};
