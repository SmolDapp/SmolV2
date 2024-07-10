import React, {useMemo, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useGetIsStablecoin} from 'packages/gimme/hooks/helpers/useGetIsStablecoin';
import {mainnet, polygon} from 'wagmi/chains';
import {cl, formatCounterValue, formatTAmount, isEthAddress, percentOf, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {TextTruncate} from '@lib/common/TextTruncate';
import {usePrices} from '@lib/contexts/usePrices';
import {IconChevron} from '@lib/icons/IconChevron';

import {SelectVault} from './SelectVault';
import {useEarnFlow} from './useEarnFlow';

import type {TAddress, TNDict} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

const WRAPPED_TOKEN_ADDRESS: TNDict<TAddress> = {
	[mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
	[polygon.id]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
};

export function SelectOpportunityButton({
	onSetOpportunity
}: {
	onSetOpportunity: (value: TYDaemonVault) => void;
}): JSX.Element {
	const {configuration} = useEarnFlow();
	const {vaultsArray} = useVaults();
	const {getPrice} = usePrices();

	const {getIsStablecoin} = useGetIsStablecoin();
	const isStablecoin = getIsStablecoin({
		address: configuration.asset.token?.address,
		chainID: configuration.asset.token?.chainID
	});

	const [isOpen, set_isOpen] = useState(false);

	const availableVaults = configuration.asset.token
		? vaultsArray.filter(vault => {
				if (isStablecoin && vault.category === 'Stablecoin') {
					return true;
				}
				if (vault.token.address === configuration.asset.token?.address) {
					return true;
				}
				if (isEthAddress(configuration.asset.token?.address) && configuration.asset.token?.chainID) {
					return vault.token.address === WRAPPED_TOKEN_ADDRESS[configuration.asset.token.chainID];
				}
				return false;
			})
		: vaultsArray;

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
							<div className={'mt-4 flex justify-between'}>
								<TextTruncate
									value={`Up to ${formatTAmount({value: maxAPR, decimals: configuration.asset.token?.decimals ?? 18, symbol: 'percent'})} APY`}
									className={'!text-grey-800 !text-3xl'}
								/>
								<button
									className={
										'bg-primary hover:bg-primaryHover flex min-w-[102px] items-center justify-between rounded-2xl py-2 pl-4 pr-2'
									}
									onClick={() => set_isOpen(true)}
									disabled={availableVaults.length === 0}>
									{'Select'}
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
				availableVaults={availableVaults}
				isStablecoin={isStablecoin}
			/>
		</>
	);
}
