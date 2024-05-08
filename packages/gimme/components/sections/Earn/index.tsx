import {type ReactElement} from 'react';
import {SmolTokenAmountInput} from 'lib/common/SmolTokenAmountInput';
import {SelectOpportunityButton} from '@gimmeDesignSystem/SelectOpportunityButton';

import {useEarnFlow} from './useEarnFlow';

import type {TTokenAmountInputElement} from 'packages/lib/types/Inputs';

export function Earn(): ReactElement {
	const {configuration, dispatchConfiguration} = useEarnFlow();

	const onSetValue = (value: Partial<TTokenAmountInputElement>): void => {
		dispatchConfiguration({type: 'SET_ASSET', payload: value});
	};

	return (
		<div className={'w-full max-w-[504px] rounded-2xl bg-white p-8 shadow-xl'}>
			<div className={'mb-6'}>
				<p className={'mb-2 text-xs font-medium'}>{'Asset'}</p>
				<SmolTokenAmountInput
					onSetValue={onSetValue}
					value={configuration.asset}
				/>
				<p className={'mb-2 mt-6 text-xs font-medium '}>{'Opportunity'}</p>
				<SelectOpportunityButton />
			</div>
		</div>
	);
}
