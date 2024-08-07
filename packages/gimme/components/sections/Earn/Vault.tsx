import {useCallback} from 'react';
import {usePlausible} from 'next-plausible';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {useAccount, useSwitchChain} from 'wagmi';
import {cl, formatTAmount, formatUSD, percentOf, toAddress} from '@builtbymom/web3/utils';
import {IconArrow} from '@gimmeDesignSystem/IconArrow';
import {PLAUSIBLE_EVENTS} from '@gimmeutils/plausible';
import * as Popover from '@radix-ui/react-popover';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {IconQuestionMark} from '@lib/icons/IconQuestionMark';

import {useEarnFlow} from './useEarnFlow';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';
import type {TVaultInfoModal} from './SelectVault';

export function Vault({
	vault,
	assetPrice,
	onSelect,
	onClose,
	onChangeVaultInfo
}: {
	vault: TYDaemonVault;
	assetPrice: TNormalizedBN;
	onSelect: (value: TYDaemonVault) => void;
	onClose: () => void;
	onChangeVaultInfo: Dispatch<SetStateAction<TVaultInfoModal>>;
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {token, name, apr} = vault;
	const {switchChainAsync} = useSwitchChain();

	const {connector} = useAccount();
	const chain = useCurrentChain();

	const plausible = usePlausible();

	const assetAmountUSD = assetPrice.normalized * configuration.asset.normalizedBigAmount.normalized;

	const earnings = percentOf(assetAmountUSD, vault.apr.netAPR * 100);

	/**********************************************************************************************
	 * Async funciton that allows us to set selected vault with some good side effects:
	 * 1. Chain is asynchronously switched if it doesn't coinside with chain vault is on.
	 * 2. Form is populated with token linked to the vault and user's balance of selected token.
	 * Exception - user has already selected native token which needs to be linked to wrapped token
	 * vault manually.
	 *********************************************************************************************/
	const onSelectVault = useCallback(async () => {
		if (vault.chainID !== chain.id) {
			await switchChainAsync({connector, chainId: vault.chainID});
		}

		plausible(PLAUSIBLE_EVENTS.SELECT_VAULT);
		onSelect(vault);
		onClose();
	}, [chain.id, connector, onClose, onSelect, plausible, switchChainAsync, vault]);

	return (
		<div
			onMouseEnter={() =>
				onChangeVaultInfo(prev => ({
					...vault,
					isOpen: prev && toAddress(prev?.address) === toAddress(vault.address)
				}))
			}
			className={cl(
				'flex justify-between rounded-lg px-4 py-3 gap-x-6 transition-colors hover:bg-grey-100',
				'cursor-pointer'
			)}
			onClick={onSelectVault}>
			<div className={'relative flex items-center gap-4'}>
				<ImageWithFallback
					alt={token.symbol}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${token.address}/logo-128.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${token.address}/logo-128.png`}
					quality={90}
					width={32}
					height={32}
				/>
				<div className={'flex flex-col items-start gap-0.5 text-left'}>
					<p className={'text-grey-900'}>
						{name}
						{' Vault'}
					</p>
					<div className={'flex flex-wrap items-start gap-1'}>
						<p className={'text-grey-600 text-xs'}>
							{`+ ${formatUSD(earnings).replace('$ ', '$')} over 1y`}
						</p>
						{configuration.asset.token &&
							vault.token.address &&
							configuration.asset.token?.address !== vault.token.address && (
								<div
									className={
										'text-xxs bg-grey-100 text-grey-800 flex items-center gap-1 rounded-sm px-1'
									}>
									{configuration.asset.token?.symbol} <IconArrow className={'size-2'} />{' '}
									{vault.token.symbol}
								</div>
							)}
					</div>
				</div>
			</div>
			<div className={'flex items-center'}>
				<p className={'mr-2 text-lg font-medium'}>
					{formatTAmount({value: apr.netAPR, decimals: token.decimals, symbol: 'percent'})}
				</p>
				<div className={'ml-4'}>
					<button
						className={'block md:hidden'}
						onClick={e => {
							e.preventDefault();
							e.stopPropagation();
							onChangeVaultInfo({...vault, isDialogOpen: true});
						}}>
						<IconQuestionMark className={'text-grey-700 size-6'} />
					</button>
					<div className={'hidden md:block'}>
						<Popover.Trigger asChild>
							<div onMouseEnter={() => onChangeVaultInfo({...vault, isPopoverOpen: true})}>
								<IconQuestionMark className={'text-grey-700 size-6'} />
							</div>
						</Popover.Trigger>
					</div>
				</div>
			</div>
		</div>
	);
}
