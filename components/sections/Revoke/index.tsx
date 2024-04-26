import {type ReactElement, useMemo} from 'react';
import {SmolTokenSelector} from 'components/designSystem/SmolTokenSelector';
import {Button} from 'components/Primitives/Button';
import {useTokensWithBalance} from 'hooks/useTokensWithBalance';
import {useAccount} from 'wagmi';

import {useAllowances} from './useAllowances';
import {RevokeWizard} from './Wizard';

import type {TToken} from '@builtbymom/web3/types';
import type {TTokenAllowance} from './useAllowances';

export function Revoke(): ReactElement {
	const {configuration, dispatchConfiguration, refreshApproveEvents} = useAllowances();
	// eslint-disable-next-line unused-imports/no-unused-vars
	const {tokensWithBalance} = useTokensWithBalance();

	const {address} = useAccount();

	const tokens: TTokenAllowance[] = useMemo(
		() =>
			tokensWithBalance.map(item => {
				return {
					address: item.address
				};
			}),
		[tokensWithBalance]
	);

	const onSubmit = (): void => {
		if (!address) {
			return;
		}

		if (!configuration.tokensToCheck?.length) {
			return;
		}

		//provide with token adsresses from multple select
		refreshApproveEvents(tokensWithBalance.map(item => item.address));
	};

	const onSelectToken = (token: TToken | undefined): void => {
		//need to dispatch selected tokens from multiple select

		dispatchConfiguration({
			type: 'SET_TOKENS_TO_CHECK',
			payload: [...tokens]
		});
		dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: token});
	};

	return (
		<div className={'w-full max-w-108'}>
			<div className={'mb-6'}>
				<p className={'font-medium'}>{'Contract address'}</p>
				<SmolTokenSelector
					onSelectToken={onSelectToken}
					token={configuration?.tokenToCheck}
				/>
			</div>
			<div>
				<Button
					className={'!h-9 !text-xs'}
					onClick={onSubmit}>
					{'Look for allowances'}
				</Button>
			</div>
			<RevokeWizard />
		</div>
	);
}
