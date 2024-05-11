import React, {useState} from 'react';
import ViewFlowSelection from '@multisafe/components/1.ViewFlowSelection';
import ViewClonableSafe from '@multisafe/components/2.ViewClonableSafe';
import ViewNewSafeOwners from '@multisafe/components/3.ViewNewSafeOwners';
import ViewNewSafe from '@multisafe/components/4.ViewNewSafe';
import {SafeCreatorContextApp, Step, useSafeCreator} from '@multisafe/components/useSafeCreator';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

function Safe(): ReactElement {
	const {currentStep, selectedFlow, set_currentStep} = useSafeCreator();
	const [owners, set_owners] = useState<TAddress[]>([]);
	const [threshold, set_threshold] = useState(1);

	return (
		<div className={'mx-auto grid w-full max-w-4xl'}>
			<div id={'flow'}>
				<ViewFlowSelection />
			</div>

			<div
				id={'flowData'}
				className={`overflow-hidden pt-10 transition-opacity${
					[Step.FLOW_DATA, Step.NEW_DEPLOY].includes(currentStep)
						? 'opacity-100'
						: 'pointer-events-none h-0 overflow-hidden opacity-0'
				}`}>
				{selectedFlow === 'EXISTING' ? <ViewClonableSafe /> : null}
				{selectedFlow === 'NEW' ? (
					<ViewNewSafeOwners
						onUpdateSafeSettings={(newOwners, newThreshold): void => {
							set_currentStep(Step.NEW_DEPLOY);
							set_owners(newOwners);
							set_threshold(newThreshold);
						}}
					/>
				) : null}
			</div>

			<div
				id={'newDeploy'}
				className={`pt-10 transition-opacity ${
					[Step.NEW_DEPLOY].includes(currentStep)
						? 'opacity-100'
						: 'pointer-events-none h-0 overflow-hidden opacity-0'
				}`}>
				{selectedFlow === 'NEW' ? (
					<ViewNewSafe
						owners={owners}
						threshold={threshold}
					/>
				) : null}
			</div>
		</div>
	);
}

export default function SafeWrapper(): ReactElement {
	return (
		<SafeCreatorContextApp>
			<Safe />
		</SafeCreatorContextApp>
	);
}
