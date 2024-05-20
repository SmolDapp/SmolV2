import {type ReactElement} from 'react';
import {formatCounterValue, formatTAmount} from '@builtbymom/web3/utils';
import {Counter} from '@gimmeDesignSystem/Counter';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function VaultRow({
	vault,
	price,
	balance
}: {
	vault: TYDaemonVault;
	balance: TNormalizedBN;
	price?: TNormalizedBN;
}): ReactElement {
	const vaultChainName = supportedNetworks.find(network => network.id === vault.chainID)?.name;
	const tokenNetworkString = `${vault.token.symbol} on ${vaultChainName}`.toLocaleUpperCase();

	return (
		<div className={'flex justify-between rounded-md border border-neutral-400 p-6'}>
			<div className={'flex min-w-[236px] items-center gap-4'}>
				<ImageWithFallback
					alt={vault.token.symbol}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${vault.token.address}/logo-32.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${vault.token.address}/logo-32.png`}
					quality={90}
					width={40}
					height={40}
				/>
				<div>
					<p className={'font-bold'}>{vault.name}</p>
					<div className={'flex items-center gap-1 text-xs'}>
						<p>{tokenNetworkString}</p>
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<div className={'w-full'}>
					<div className={'bg-primary mb-4 flex w-full rounded-md p-1 text-xs font-bold'}>
						{`APR ${formatTAmount({value: vault.apr.netAPR, decimals: vault.decimals, symbol: 'percent'})}`}
					</div>
				</div>

				<div className={'flex w-full  min-w-[160px] flex-col items-end'}>
					<p className={'font-bold'}>
						<Counter
							value={balance.normalized}
							decimals={vault.decimals}
							decimalsToDisplay={[6, 12]}
						/>

						{/* {formatAmount(userBalanceAsUnderlying.normalized, 4)} */}
					</p>
					<p className={'text-xs'}>
						{price?.normalized ? formatCounterValue(balance.normalized, price?.normalized) : 'N/A'}
					</p>
				</div>
				<div className={'flex w-full min-w-[132px] justify-end gap-2'}>
					<button
						className={
							'relative flex size-6 items-center justify-center rounded-full border border-neutral-600 transition-colors hover:bg-neutral-200'
						}>
						<p className={'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}>{'-'}</p>
					</button>
					<button
						className={
							'relative mr-2 flex size-6 items-center justify-center rounded-full border border-neutral-600 transition-colors hover:bg-neutral-200'
						}>
						<p className={'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}>{'+'}</p>
					</button>
				</div>
			</div>
		</div>
	);
}
