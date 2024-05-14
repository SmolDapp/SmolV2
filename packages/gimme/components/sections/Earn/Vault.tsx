import {ImageWithFallback} from 'lib/common/ImageWithFallback';
import {IconQuestionMark} from 'lib/icons/IconQuestionMark';
import {cl, formatCounterValue, formatTAmount, percentOf} from '@builtbymom/web3/utils';

import {useEarnFlow} from './useEarnFlow';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

function VaultRisk({value}: {value: 'low' | 'medium' | 'high'}): ReactElement {
	return (
		<div className={'flex items-end gap-[6px]'}>
			<div className={'h-[9px] w-[3px] rounded-sm bg-neutral-900'} />
			<div
				className={cl('h-[15px] w-[3px] rounded-sm bg-neutral-900', value === 'low' ? '!bg-neutral-600' : '')}
			/>
			<div
				className={cl(
					'h-[21px] w-[3px] rounded-sm bg-neutral-900',
					value === 'medium' || value === 'low' ? '!bg-neutral-600' : ''
				)}
			/>
		</div>
	);
}

export function Vault({
	vault,
	price,
	onSelect,
	onClose
}: {
	vault: TYDaemonVault;
	price: TNormalizedBN | undefined;
	onSelect: (value: TYDaemonVault) => void;
	onClose: () => void;
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {token, chainID, name, apr} = vault;

	const earnings = percentOf(configuration.asset.normalizedBigAmount.normalized, apr.netAPR * 100);
	return (
		<div
			className={
				'flex w-full cursor-pointer justify-between rounded-md px-4 py-3 transition-colors hover:bg-neutral-200'
			}
			onClick={() => {
				onSelect(vault);
				onClose();
			}}>
			<div className={'flex items-center gap-4'}>
				<ImageWithFallback
					alt={token.symbol}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${chainID}/${token.address}/logo-32.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${chainID}/${token.address}/logo-32.png`}
					quality={90}
					width={32}
					height={32}
				/>
				<div className={'flex flex-col items-start gap-0.5'}>
					<p>{name}</p>
					<div className={'flex items-start gap-1'}>
						<p className={'text-xs text-[#AF9300]'}>
							{`+ ${formatCounterValue(earnings, price?.normalized || 0)} over 1y`}
						</p>
						{/* <div className={'text-xxs rounded-sm bg-neutral-400 px-1 text-neutral-700'}>
							{'DAI -> USDT'}
						</div> */}
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<p className={'mr-6 text-lg font-medium'}>
					{formatTAmount({value: apr.netAPR, decimals: token.decimals, symbol: 'percent'})}
				</p>
				<VaultRisk value={'medium'} />
				<button className={'ml-4'}>
					<IconQuestionMark className={'size-6 text-neutral-600'} />
				</button>
			</div>
		</div>
	);
}
