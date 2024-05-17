import {formatCounterValue, formatTAmount} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function VaultRow({vault}: {vault: TYDaemonVault}): ReactElement {
	return (
		<div className={'flex justify-between rounded-md border border-neutral-400 p-6'}>
			<div className={'flex min-w-[260px] items-center gap-4'}>
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
					<p className={'font-bold'}>{'Yearn DAI Vault v3'}</p>
					<div className={'flex items-center gap-1 text-xs'}>
						<p>{'DAI on POLYGON'}</p>
						<p className={'text-neutral-600'}>{'56 days ago'}</p>
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<div className={'bg-primary flex w-full rounded-md p-1 text-xs font-bold'}>
					{`APR ${formatTAmount({value: vault.apr.netAPR, decimals: vault.decimals, symbol: 'percent'})}`}
				</div>
				<div className={'flex w-full min-w-[106px] flex-col items-end'}>
					<p>{formatTAmount({value: 148, decimals: 6})}</p>
					<p className={'text-xs'}>{formatCounterValue(148, 1)}</p>
				</div>
				<div className={'flex w-full min-w-[90px] flex-col items-end'}>
					<p className={'font-bold'}>{formatTAmount({value: 420.69, decimals: 1})}</p>
					<p className={'text-xs'}>{formatCounterValue(420.69, 1)}</p>
				</div>
				<div className={'w-full min-w-[120px]'}></div>
			</div>
		</div>
	);
}
