import React, {useMemo, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {ImageWithFallback} from 'packages/lib/common/ImageWithFallback';
import {IconChevron} from 'packages/lib/icons/IconChevron';
import {cl, formatTAmount} from '@builtbymom/web3/utils';

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
	const {vaults} = useVaults();
	const [isOpen, set_isOpen] = useState(false);

	const maxAPR = useMemo(() => {
		const vaultsToUse = configuration.asset.token?.address ? filteredVaults : vaults;
		const APRs = vaultsToUse.map(vault => vault.apr.netAPR);
		const max = Math.max(...APRs);
		return max;
	}, [configuration.asset.token?.address, filteredVaults, vaults]);

	return (
		<>
			<div className={'relative size-full'}>
				<div
					className={cl(
						'h-20 z-20 relative border transition-all w-full',
						'flex flex-row items-center cursor-text',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors',
						'p-2 group bg-neutral-0 rounded-[8px]',
						'border-neutral-400'
					)}>
					<button
						className={cl(
							'flex items-center justify-between gap-2 rounded-[4px] py-2 pl-4 pr-2 size-full',
							'transition-colors',
							'disabled:opacity-30 disabled:cursor-not-allowed',
							configuration.opportunity
								? 'bg-neutral-200 hover:bg-neutral-300'
								: 'bg-primary hover:bg-primaryHover'
						)}
						onClick={() => set_isOpen(true)}
						disabled={filteredVaults.length === 0}>
						{configuration.opportunity ? (
							<>
								<div className={'flex w-full items-center gap-4'}>
									<div
										className={
											'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'
										}>
										<ImageWithFallback
											alt={configuration.opportunity.token.symbol}
											unoptimized
											src={`${process.env.SMOL_ASSETS_URL}/token/${configuration.opportunity.chainID}/${configuration.opportunity.token.address}/logo-32.png`}
											altSrc={`${process.env.SMOL_ASSETS_URL}/token/${configuration.opportunity.chainID}/${configuration.opportunity.token.address}/logo-32.png`}
											quality={90}
											width={40}
											height={40}
										/>
									</div>
									<p className={'w-full break-normal text-left font-bold'}>
										{/* {'USDT Optimism v2 very long name'} */}
										{configuration.opportunity.name}
									</p>
								</div>
								<div className={'bg-primary max-w-22 w-full rounded-md p-1 text-xs font-bold'}>
									{`APY ${formatTAmount({value: configuration.opportunity.apr.netAPR, decimals: configuration.opportunity.decimals, symbol: 'percent'})}`}
								</div>
								<IconChevron className={'size-4 min-w-4 text-neutral-600'} />
							</>
						) : (
							<div className={'flex size-full flex-col items-center'}>
								<p className={'font-bold'}>{'Select Opportunity'}</p>
								<p className={'text-xs'}>
									{`Earn up to ${formatTAmount({value: maxAPR, decimals: configuration.asset.token?.decimals ?? 18, symbol: 'percent'})} APY`}
								</p>
							</div>
						)}
					</button>
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
