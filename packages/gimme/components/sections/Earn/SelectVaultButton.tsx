import React, {useMemo, useState} from 'react';
import Image from 'next/image';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {cl, formatCounterValue, formatTAmount, percentOf, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {usePrices} from '@lib/contexts/usePrices';
import {IconChevron} from '@lib/icons/IconChevron';

import {SelectVault} from './SelectVault';
import {useEarnFlow} from './useEarnFlow';

import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function SelectOpportunityButton({
	onSetOpportunity,
	filteredVaults
}: {
	onSetOpportunity: (value: TYDaemonVault) => void;
	filteredVaults: TYDaemonVault[];
}): JSX.Element {
	const {configuration} = useEarnFlow();
	const {vaultsArray} = useVaults();
	const {getPrice} = usePrices();

	const [isOpen, set_isOpen] = useState(false);

	const maxAPR = useMemo(() => {
		const vaultsToUse = configuration.asset.token?.address ? filteredVaults : vaultsArray;
		const APRs = vaultsToUse.map(vault => vault.apr.netAPR);
		const max = Math.max(...APRs);
		return max;
	}, [configuration.asset.token?.address, filteredVaults, vaultsArray]);

	const earnings = configuration.opportunity
		? percentOf(configuration.asset.normalizedBigAmount.normalized, configuration.opportunity.apr.netAPR * 100)
		: 0;

	const price = configuration.opportunity
		? getPrice({address: configuration.opportunity.token.address, chainID: configuration.opportunity.chainID})
		: zeroNormalizedBN;

	return (
		<>
			<div className={'relative size-full'}>
				<div
					className={cl(
						'h-[120px] z-20 relative transition-all w-full',
						'cursor-text',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors',
						'py-4 px-6 group bg-grey-100 rounded-2xl'
					)}>
					{configuration.opportunity ? (
						<div className={'flex h-full items-center justify-between'}>
							<div className={'flex h-full flex-col justify-between'}>
								<div className={'flex items-center gap-2'}>
									<p className={'text-grey-800 text-xs font-medium'}>{'Opportunity'}</p>
									<div className={'bg-primary rounded-2xl px-2 py-0.5 text-xs font-medium'}>
										{`APY ${formatTAmount({value: configuration.opportunity.apr.netAPR, decimals: configuration.opportunity.decimals, symbol: 'percent'})}`}
									</div>
								</div>
								<div className={'flex gap-2'}>
									<div className={'bg-primary flex size-8 items-center justify-center rounded-full'}>
										<Image
											src={'/vault-logo.svg'}
											alt={'vault-logo'}
											width={18}
											height={18}
										/>
									</div>
									<div className={'flex flex-col'}>
										<p
											className={
												'text-grey-800 w-full break-normal text-left text-lg font-medium'
											}>
											{configuration.opportunity.name}
										</p>
										<p className={'text-grey-600 text-xs'}>
											{`+ ${formatCounterValue(earnings, price?.normalized || 0)} over 1y`}
										</p>
									</div>
								</div>
							</div>
							<button
								className={'hover:bg-grey-200 flex items-center rounded-full p-2 transition-colors'}
								onClick={() => set_isOpen(true)}>
								<IconChevron className={'size-6 min-w-4'} />
							</button>
						</div>
					) : (
						<>
							<p className={'text-grey-800 text-xs font-medium'}>{'Opportunity'}</p>
							<div className={'mt-4 flex justify-between'}>
								<p className={'text-grey-800 text-3xl'}>
									{`Up to  ${formatTAmount({value: maxAPR, decimals: configuration.asset.token?.decimals ?? 18, symbol: 'percent'})} APY`}
								</p>
								<button
									className={
										'bg-primary hover:bg-primaryHover flex w-[152px] items-center justify-between rounded-2xl py-2 pl-4 pr-2'
									}
									onClick={() => set_isOpen(true)}
									disabled={filteredVaults.length === 0}>
									{'Select Pool'}
									<IconChevron className={'size-6 min-w-4'} />
								</button>
							</div>
						</>
					)}
				</div>
			</div>
			<SelectVault
				isOpen={isOpen}
				onClose={() => set_isOpen(false)}
				onSelect={onSetOpportunity}
				filteredVaults={filteredVaults}
			/>
		</>
	);
}
