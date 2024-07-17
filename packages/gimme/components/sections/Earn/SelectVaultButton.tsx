import React, {useMemo, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {cl, formatCounterValue, formatTAmount, percentOf, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {TextTruncate} from '@lib/common/TextTruncate';
import {usePrices} from '@lib/contexts/usePrices';
import {IconChevron} from '@lib/icons/IconChevron';

import {SelectVault} from './SelectVault';
import {useEarnFlow} from './useEarnFlow';

import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function SelectOpportunityButton(props: {onSetOpportunity: (value: TYDaemonVault) => void}): JSX.Element {
	const {configuration} = useEarnFlow();
	const {vaultsArray} = useVaults();
	const {getPrice} = usePrices();
	const [isOpen, set_isOpen] = useState(false);
	const availableVaults = vaultsArray;

	const maxAPR = useMemo(() => {
		const APRs = availableVaults.map(vault => vault.apr.netAPR);
		const max = Math.max(...APRs);
		return max;
	}, [availableVaults]);

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
						'pt-4 pr-2 pb-4 pl-4 md:pr-6 md:pb-8 md:pl-6 group bg-grey-100 rounded-2xl'
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
									<ImageWithFallback
										alt={configuration.opportunity.token?.symbol || 'token'}
										unoptimized
										src={`${process.env.SMOL_ASSETS_URL}/token/${configuration.opportunity?.chainID}/${configuration.opportunity.token.address}/logo-128.png`}
										altSrc={`${process.env.SMOL_ASSETS_URL}/token/${configuration.opportunity?.chainID}/${configuration.opportunity.token.address}/logo-128.png`}
										quality={90}
										width={32}
										height={32}
									/>
									<div className={'flex flex-col'}>
										<p
											className={
												'text-grey-800 w-full break-normal text-left text-lg font-medium'
											}>
											{configuration.opportunity.name} {'Vault'}
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
								<IconChevron className={'text-grey-800 size-6 min-w-4'} />
							</button>
						</div>
					) : (
						<>
							<p className={'text-grey-800 text-xs font-medium'}>{'Opportunity'}</p>
							<div className={'flex h-[74px] items-end justify-between md:mt-4 md:items-start'}>
								<TextTruncate
									value={`Up to ${formatTAmount({value: maxAPR, decimals: configuration.asset.token?.decimals ?? 18, symbol: 'percent'})} APY`}
									className={'!text-grey-800 !text-lg md:mt-1.5 md:max-h-8 md:!text-3xl'}
								/>
								<button
									className={
										'bg-primary hover:bg-primaryHover self-top mt-[10px] flex items-center justify-between self-baseline rounded-2xl p-2 md:mt-0 md:min-w-[102px] md:pl-4'
									}
									onClick={() => set_isOpen(true)}
									disabled={availableVaults.length === 0}>
									<p className={'hidden md:inline'}>{'Select'}</p>
									<IconChevron className={'size-6'} />
								</button>
							</div>
						</>
					)}
				</div>
			</div>
			<SelectVault
				isOpen={isOpen}
				onClose={() => set_isOpen(false)}
				onSelect={props.onSetOpportunity}
				availableVaults={availableVaults}
			/>
		</>
	);
}
