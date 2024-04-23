import {SmolTokenSelector} from 'components/designSystem/SmolTokenSelector';
import {Button} from 'components/Primitives/Button';
import {useAccount} from 'wagmi';

import {useAllowances} from './useAllowances';
import {RevokeWizard} from './Wizard';

import type {ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';

export function Revoke(): ReactElement {
	const {configuration, dispatchConfiguration, refreshApproveEvents} = useAllowances();
	const {address} = useAccount();

	const onSubmit = (): void => {
		if (!address) {
			return;
		}

		if (!configuration.tokensToCheck?.length) {
			return;
		}

		//provide with token adsresses from multple select
		refreshApproveEvents([
			'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			'0xdAC17F958D2ee523a2206206994597C13D831ec7',
			'0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919',
			'0x35A9b440Da4410dD63dF8c54672b728970560328',
			'0x111111111117dc0aa78b770fa6a738034120c302'
		]);
	};

	const onSelectToken = (token: TToken | undefined): void => {
		//need to dispatch selected tokens from multiple select

		dispatchConfiguration({
			type: 'SET_TOKENS_TO_CHECK',
			payload: [
				{address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'},
				{address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'},
				{address: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919'},
				{address: '0x35A9b440Da4410dD63dF8c54672b728970560328'},
				{address: '0x111111111117dc0aa78b770fa6a738034120c302'}
			]
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
