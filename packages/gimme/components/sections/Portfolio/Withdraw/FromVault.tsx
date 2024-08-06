import {formatTAmount} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function FromVault(props: {vault: TYDaemonVault; balance: TNormalizedBN}): ReactElement {
	return (
		<div className={'bg-grey-100 flex w-full items-center justify-between rounded-2xl px-4 py-6 sm:px-6'}>
			<div className={'text-left'}>
				<p className={'text-grey-800 font-bold'}>{props.vault.name}</p>
				<div className={'flex flex-wrap gap-1'}>
					<p className={'text-grey-700 text-xs'}>{'Total deposited:'}</p>
					<p className={'text-grey-800 text-xs'}>
						{formatTAmount({
							value: props.balance.raw,
							decimals: props.vault.token.decimals,
							symbol: props.vault.token.symbol
						})}
					</p>
				</div>
			</div>
			<div>
				<ImageWithFallback
					alt={props.vault.token?.symbol || 'token'}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${props.vault.chainID}/${props.vault.token.address}/logo-128.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.vault.chainID}/${props.vault.token.address}/logo-128.png`}
					quality={90}
					width={40}
					height={40}
				/>
			</div>
		</div>
	);
}
