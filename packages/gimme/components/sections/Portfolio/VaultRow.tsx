import {type ReactElement} from 'react';
import toast from 'react-hot-toast';
import {useRouter} from 'next/router';
import {useAccount, useSwitchChain} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {formatCounterValue, formatTAmount, percentOf, toAddress} from '@builtbymom/web3/utils';
import {Counter} from '@gimmeDesignSystem/Counter';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {BaseError} from 'wagmi';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function VaultRow(props: {vault: TYDaemonVault; balance: TNormalizedBN; price?: TNormalizedBN}): ReactElement {
	const vaultChainName = supportedNetworks.find(network => network.id === props.vault.chainID)?.name;
	const tokenNetworkString = `${props.vault.token.symbol} on ${vaultChainName}`.toLocaleUpperCase();
	const router = useRouter();
	const {chainID} = useWeb3();

	const {connector} = useAccount();

	const {switchChainAsync} = useSwitchChain();

	const onAction = async ({
		tokenAddress,
		vaultAddress
	}: {
		tokenAddress: TAddress;
		vaultAddress?: TAddress;
	}): Promise<void> => {
		try {
			const URLQueryParam = new URLSearchParams();
			URLQueryParam.set('tokenAddress', toAddress(tokenAddress));
			vaultAddress && URLQueryParam.set('vaultAddress', toAddress(vaultAddress));

			if (props.vault.chainID !== chainID) {
				await switchChainAsync({connector, chainId: props.vault.chainID});
			}

			router.push({
				pathname: '/earn',
				query: URLQueryParam.toString()
			});
		} catch (err) {
			toast.error((err as BaseError)?.message || 'An error occured while creating your transaction!');
		}
	};

	return (
		<div className={'grid w-full grid-cols-12 justify-between rounded-md border border-neutral-400 p-6'}>
			<div className={'col-span-5 flex min-w-[236px] items-center gap-4'}>
				<ImageWithFallback
					alt={props.vault.token.symbol}
					unoptimized
					src={`${process.env.SMOL_ASSETS_URL}/token/${props.vault.chainID}/${props.vault.token.address}/logo-128.png`}
					altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.vault.chainID}/${props.vault.token.address}/logo-128.png`}
					quality={90}
					width={40}
					height={40}
				/>
				<div>
					<p className={'font-bold'}>{props.vault.name}</p>
					<div className={'flex items-center gap-1 text-xs'}>
						<p>{tokenNetworkString}</p>
					</div>
				</div>
			</div>
			<div className={'col-span-7 grid grid-cols-8 gap-x-7'}>
				<div className={'group col-span-2 flex flex-row items-center justify-end'}>
					<div className={'bg-primary mb-4 flex rounded-md p-1 text-xs font-bold'}>
						{`APY ${formatTAmount({value: props.vault.apr.netAPR, decimals: props.vault.decimals, symbol: 'percent'})}`}
					</div>
				</div>
				<div className={'group col-span-2 flex flex-col items-end'}>
					<p className={'font-bold'}>
						<Counter
							value={props.balance.normalized}
							decimals={props.vault.decimals}
							decimalsToDisplay={[6, 12]}
						/>
					</p>
					<p className={'text-xs'}>
						{props.price?.normalized
							? formatCounterValue(props.balance.normalized, props.price?.normalized)
							: 'N/A'}
					</p>
				</div>
				<div className={'group col-span-2 mb-4 flex flex-row items-center justify-end'}>
					<p className={'font-bold'}>
						{`+${formatCounterValue(percentOf(props.balance.normalized, props.vault.apr.netAPR * 100), props.price?.normalized || 0)}`}
					</p>
				</div>
				<div className={'group col-span-2 flex flex-row items-center justify-end gap-2'}>
					<button
						onClick={async () => onAction({tokenAddress: props.vault.address})}
						className={
							'relative flex size-6 items-center justify-center rounded-full border border-neutral-600 transition-colors hover:bg-neutral-200'
						}>
						<p className={'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}>{'-'}</p>
					</button>
					<button
						onClick={async () =>
							onAction({tokenAddress: props.vault.token.address, vaultAddress: props.vault.address})
						}
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
