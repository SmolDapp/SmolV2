import {type ReactElement, useMemo} from 'react';
import {SmolTokenAmountInput} from 'lib/common/SmolTokenAmountInput';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {toAddress} from '@builtbymom/web3/utils';
import {SelectOpportunityButton} from '@gimmmeSections/Earn/SelectVaultButton';

import {EarnWizard} from './EarnWizard';
import {useEarnFlow} from './useEarnFlow';

import type {TTokenAmountInputElement} from 'packages/lib/types/Inputs';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function Earn(): ReactElement {
	const {configuration, dispatchConfiguration} = useEarnFlow();

	const onSetAsset = (value: Partial<TTokenAmountInputElement>): void => {
		dispatchConfiguration({type: 'SET_ASSET', payload: value});
	};

	const onSetOpportunity = (value: TYDaemonVault): void => {
		dispatchConfiguration({type: 'SET_OPPORTUNITY', payload: value});
	};

	const {vaults} = useVaults();

	const filteredVaults = useMemo(() => {
		if (!configuration.asset.token?.address) {
			return [];
		}
		return Object.values(vaults).filter(
			rawVault => rawVault.token.address === toAddress(configuration.asset.token?.address)
		);
	}, [configuration.asset.token?.address, vaults]);

	return (
		<div className={'w-full max-w-[504px] rounded-2xl bg-white p-8 shadow-xl'}>
			<div className={'w-full'}>
				<p className={'mb-2 text-xs font-medium'}>{'Asset'}</p>
				<SmolTokenAmountInput
					onSetValue={onSetAsset}
					value={configuration.asset}
				/>
				<p className={'mb-2 mt-6 text-xs font-medium '}>{'Opportunity'}</p>
				<SelectOpportunityButton
					onSetOpportunity={onSetOpportunity}
					filteredVaults={filteredVaults}
				/>
				<EarnWizard />
			</div>
		</div>
	);
}
