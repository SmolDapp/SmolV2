import {type ReactElement, useCallback} from 'react';
import {useAccount, useSwitchChain} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatCounterValue, formatTAmount, percentOf} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {IconQuestionMark} from '@lib/icons/IconQuestionMark';

import {useEarnFlow} from './useEarnFlow';

import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

// function VaultRisk({value}: {value: number}): ReactElement {
// 	const heights = ['3', '9', '15', '21', '27'];

// 	return (
// 		<div className={'flex size-full items-end gap-[6px]'}>
// 			{Array(5)
// 				.fill(null)
// 				.map((_, index) => {
// 					if (index === 0) {
// 						return <div className={`size-[${heights[index]}px] rounded-sm bg-neutral-900`} />;
// 					}
// 					return (
// 						<div
// 							className={cl(
// 								`h-[${heights[index]}px] w-[3px] rounded-sm bg-neutral-900`,
// 								index + 1 > value ? '!bg-neutral-600' : ''
// 							)}
// 						/>
// 					);
// 				})}
// 		</div>
// 	);
// }

export function Vault({
	vault,
	price,
	isDisabled = false,
	onSelect,
	onClose,
	onChangeVaultInfo
}: {
	vault: TYDaemonVault;
	price: TNormalizedBN | undefined;
	isDisabled: boolean;
	onSelect: (value: TYDaemonVault) => void;
	onClose: () => void;
	onChangeVaultInfo: (value: TYDaemonVault | undefined) => void;
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {token, name, apr} = vault;

	const {chainID} = useWeb3();
	const {switchChainAsync} = useSwitchChain();
	const {connector} = useAccount();

	const earnings = percentOf(configuration.asset.normalizedBigAmount.normalized, apr.netAPR * 100);

	/**********************************************************************************************
	 * Async funciton that allows us to set selected vault with some good side effects:
	 * 1. Chain is asynchronously switched if it doesn't coinside with chain vault is on.
	 * 2. Form is populated with token linked to the vault and user's balance of selected token.
	 * Exception - user has already selected native token which needs to be linked to wrapped token
	 * vault manually.
	 *********************************************************************************************/
	const onSelectVault = useCallback(async () => {
		if (vault.chainID !== chainID) {
			await switchChainAsync({connector, chainId: vault.chainID});
		}

		onSelect(vault);
		onClose();
	}, [chainID, connector, onClose, onSelect, switchChainAsync, vault]);

	return (
		<div
			className={cl(
				'flex w-full justify-between rounded-md px-4 py-3 transition-colors hover:bg-neutral-200',
				isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
			)}
			onClick={isDisabled ? undefined : onSelectVault}>
			<div className={'relative flex items-center gap-4'}>
				<ImageWithFallback
					alt={token.symbol}
					unoptimized
					src={'/opportunity.png'}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${token.address}/logo-128.png`}
					quality={90}
					width={32}
					height={32}
				/>
				<div className={'flex flex-col items-start gap-0.5 text-left'}>
					<p>{name}</p>
					<div className={'flex items-start gap-1'}>
						<p className={'text-green text-xs'}>
							{`+ ${formatCounterValue(earnings, price?.normalized || 0)} over 1y`}
						</p>
						{configuration.asset.token &&
							vault.token.address &&
							configuration.asset.token?.address !== vault.token.address && (
								<div className={'text-xxs rounded-sm bg-neutral-400 px-1 text-neutral-700'}>
									{`${configuration.asset.token?.symbol} -> ${vault.token.symbol}`}
								</div>
							)}
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<p className={'mr-2 text-lg font-medium'}>
					{formatTAmount({value: apr.netAPR, decimals: token.decimals, symbol: 'percent'})}
				</p>
				{/* <div className={'mr-3'}>
					<VaultRisk value={vault.info.riskLevel || 5} />
				</div> */}

				<div
					className={'ml-4'}
					onMouseEnter={() => onChangeVaultInfo(vault)}
					onMouseLeave={() => onChangeVaultInfo(undefined)}>
					<IconQuestionMark className={'size-6 text-neutral-600'} />
				</div>
			</div>
		</div>
	);
}
