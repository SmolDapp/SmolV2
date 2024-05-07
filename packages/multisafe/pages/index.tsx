import React, {useState} from 'react';
import {DefaultSeo} from 'next-seo';
import Logo from 'packages/lib/icons/logo';
import ViewFlowSelection from '@multisafe/components/1.ViewFlowSelection';
import ViewClonableSafe from '@multisafe/components/2.ViewClonableSafe';
import ViewNewSafeOwners from '@multisafe/components/3.ViewNewSafeOwners';
import ViewNewSafe from '@multisafe/components/4.ViewNewSafe';
import {SafeCreatorContextApp, Step, useSafeCreator} from '@multisafe/components/useSafeCreator';
import {WalletSelector} from '@multisafeCommons/HeaderElements';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

function Safe(): ReactElement {
	const {currentStep, selectedFlow, set_currentStep} = useSafeCreator();
	const [owners, set_owners] = useState<TAddress[]>([]);
	const [threshold, set_threshold] = useState(1);

	return (
		<div className={'mx-auto grid w-full max-w-4xl'}>
			<div className={'mt-10 grid w-full pb-6'}>
				<div className={'box-0 flex w-full justify-between p-6'}>
					<div className={'flex items-center gap-4'}>
						<Logo
							className={
								'size-16 overflow-visible rounded-bl-md rounded-br-lg rounded-tl-lg rounded-tr-md border border-neutral-400 p-3 text-black'
							}
						/>
						<div>
							{/* {'Make your multi-sig, multi-chain.'} */}
							<h1 className={'w-full text-xl tracking-tight text-neutral-900'}>
								{'Make your multi-sig, multi-chain.'}
							</h1>
							<p
								className={
									'mt-2 w-full whitespace-pre text-base leading-normal text-neutral-600 md:w-2/3'
								}>
								{'Get the same Safe address on all chains. Wow, fancy!'}
							</p>
						</div>
					</div>
					<WalletSelector />
				</div>
			</div>

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
			<>
				<DefaultSeo
					title={'MultiSafe - SmolDapp'}
					defaultTitle={'MultiSafe - SmolDapp'}
					description={'One address, all the chains. Deploy your Safe across multiple chains.'}
					openGraph={{
						type: 'website',
						locale: 'en-US',
						url: 'https://smold.app/safe',
						site_name: 'MultiSafe - SmolDapp',
						title: 'MultiSafe - SmolDapp',
						description: 'One address, all the chains. Deploy your Safe across multiple chains.',
						images: [
							{
								url: 'https://smold.app/og_multisafe.png',
								width: 800,
								height: 400,
								alt: 'MultiSafe'
							}
						]
					}}
					twitter={{
						handle: '@smoldapp',
						site: '@smoldapp',
						cardType: 'summary_large_image'
					}}
				/>
				<Safe />
			</>
		</SafeCreatorContextApp>
	);
}
