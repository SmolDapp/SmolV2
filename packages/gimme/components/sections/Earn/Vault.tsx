import {type ReactElement, useCallback} from 'react';
import {useAccount, useSwitchChain} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatCounterValue, formatTAmount, percentOf, toAddress} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {useValidateAmountInput} from '@lib/hooks/useValidateAmountInput';
import {IconQuestionMark} from '@lib/icons/IconQuestionMark';

import {useEarnFlow} from './useEarnFlow';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
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
	onClose,
	onChangeVaultInfo
}: {
	vault: TYDaemonVault;
	price: TNormalizedBN | undefined;
	onSelect: (value: TYDaemonVault) => void;
	onClose: () => void;
	onChangeVaultInfo: (value: TYDaemonVault | undefined) => void;
}): ReactElement {
	const {configuration, dispatchConfiguration} = useEarnFlow();
	const {token, name, apr} = vault;
	const {validate} = useValidateAmountInput();
	const {getBalance} = useWallet();
	const {onConnect, address, chainID} = useWeb3();
	const {switchChainAsync} = useSwitchChain();
	const {connector} = useAccount();

	const earnings = percentOf(configuration.asset.normalizedBigAmount.normalized, apr.netAPR * 100);

	const onSelectVault = useCallback(async () => {
		if (!address) {
			onConnect();
		}

		if (vault.chainID !== chainID) {
			await switchChainAsync({connector, chainId: vault.chainID});
		}

		onSelect(vault);
		onClose();

		await new Promise(resolve => setTimeout(resolve, 500)); // sleep

		if (configuration.asset.token?.address !== vault.token.address) {
			const balance = getBalance({
				address: toAddress(vault.token.address),
				chainID: vault.chainID
			});
			const vaultToken: TToken = {
				address: vault.token.address,
				chainID: vault.chainID,
				name: vault.token.name,
				symbol: vault.token.symbol,
				decimals: vault.token.decimals,
				balance: balance,
				value: 0
			};
			const validatedAssetInput = validate(balance.normalized ? balance.display : undefined, vaultToken);
			dispatchConfiguration({type: 'SET_ASSET', payload: validatedAssetInput});
		}
	}, [
		address,
		chainID,
		configuration.asset.token?.address,
		connector,
		dispatchConfiguration,
		getBalance,
		onClose,
		onConnect,
		onSelect,
		switchChainAsync,
		validate,
		vault
	]);

	return (
		<div
			className={
				'flex w-full cursor-pointer justify-between rounded-md px-4 py-3 transition-colors hover:bg-neutral-200'
			}
			onClick={onSelectVault}>
			<div className={'relative flex items-center gap-4'}>
				<div className={'absolute -left-1 top-0'}>
					<ImageWithFallback
						width={16}
						height={16}
						alt={vault.chainID.toString()}
						src={`${process.env.SMOL_ASSETS_URL}/chain/${vault.chainID}/logo-32.png`}
					/>
				</div>
				<ImageWithFallback
					alt={token.symbol}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${token.address}/logo-32.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${vault.chainID}/${token.address}/logo-32.png`}
					quality={90}
					width={32}
					height={32}
				/>
				<div className={'flex flex-col items-start gap-0.5 text-left'}>
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
				<button
					className={'ml-4'}
					onMouseEnter={() => onChangeVaultInfo(vault)}
					onMouseLeave={() => onChangeVaultInfo(undefined)}>
					<IconQuestionMark className={'size-6 text-neutral-600'} />
				</button>
			</div>
		</div>
	);
}
