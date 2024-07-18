import {type ReactElement} from 'react';
import toast from 'react-hot-toast';
import {useRouter} from 'next/router';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {useAccount, useSwitchChain} from 'wagmi';
import {formatCounterValue, formatTAmount, percentOf, toAddress} from '@builtbymom/web3/utils';
import {IconMinus} from '@gimmeDesignSystem/IconMinus';
import {IconPlus} from '@gimmeDesignSystem/IconPlus';
import {Counter} from '@lib/common/Counter';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {Button} from '@lib/primitives/Button';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {BaseError} from 'wagmi';
import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function VaultRow(props: {vault: TYDaemonVault; balance: TNormalizedBN; price?: TNormalizedBN}): ReactElement {
	const vaultChainName = supportedNetworks.find(network => network.id === props.vault.chainID)?.name;
	const tokenNetworkString = `${props.vault.token.symbol} on ${vaultChainName}`.toLocaleUpperCase();
	const router = useRouter();
	const {connector} = useAccount();
	const {switchChainAsync} = useSwitchChain();
	const chain = useCurrentChain();

	/**********************************************************************************************
	 * Function that is used to handle redirecting to the earn page with proper query params.
	 * There 2 cases this function can be used:
	 * 1. Deposit
	 * @param tokenAddress is vault token address
	 * @param vaultAddress is address of the current vault
	 *
	 * 2. Withdraw
	 * @param tokenAddress is a vault address (form should be populated with staking token to be
	 * able to withraw)
	 * @param vaultAddress is not present
	 *********************************************************************************************/
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

			if (props.vault.chainID !== chain.id) {
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
		<div
			className={
				'border-grey-200 grid w-full grid-cols-1 justify-between gap-y-4 rounded-2xl border p-6 md:grid-cols-12'
			}>
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
			<div className={'col-span-7 grid grid-cols-2 gap-x-7 gap-y-4 md:grid-cols-8'}>
				<div className={'group col-span-2 flex flex-row items-center justify-between md:justify-end'}>
					<p className={'inline text-start text-xs text-neutral-800/60 md:hidden'}>{'APY'}</p>
					<div className={'bg-primary flex rounded-2xl px-2 py-1 text-xs font-medium md:mb-4'}>
						{`APY ${formatTAmount({value: props.vault.apr.netAPR, decimals: props.vault.decimals, symbol: 'percent'})}`}
					</div>
				</div>
				<div className={'group col-span-2 flex justify-between md:block'}>
					<p className={'inline text-start text-xs text-neutral-800/60 md:hidden'}>{'Savings'}</p>
					<div className={'flex flex-col items-end'}>
						<p className={'font-bold'}>
							<Counter
								value={props.balance.normalized}
								idealDecimals={4}
								decimals={4}
								decimalsToDisplay={[6, 12]}
								shouldDustify
							/>
						</p>
						<p className={'text-grey-700 text-xs'}>
							{'$'}
							<Counter
								value={
									props.balance.normalized && props.price?.normalized
										? props.balance.normalized * props.price.normalized
										: 0
								}
								idealDecimals={2}
								decimals={2}
								decimalsToDisplay={[6]}
							/>
						</p>
					</div>
				</div>
				<div className={'group col-span-2 flex flex-row items-center justify-between md:mb-4 md:justify-end'}>
					<p className={'inline text-start text-xs text-neutral-800/60 md:hidden'}>{'Est. Yield'}</p>
					<p className={'font-bold'}>
						{`${formatCounterValue(percentOf(props.balance.normalized, props.vault.apr.netAPR * 100), props.price?.normalized || 0)}`}
					</p>
				</div>
				<div className={'group col-span-2 hidden flex-row items-center justify-end gap-4 md:flex'}>
					<button
						onClick={async () => onAction({tokenAddress: props.vault.address})}
						className={
							'border-grey-700 hover:bg-grey-200 relative flex size-8 items-center justify-center rounded-full border transition-colors'
						}>
						<IconMinus />
					</button>
					<button
						onClick={async () =>
							onAction({tokenAddress: props.vault.token.address, vaultAddress: props.vault.address})
						}
						className={
							'border-grey-700 hover:bg-grey-200 relative flex size-8 items-center justify-center rounded-full border transition-colors'
						}>
						<IconPlus />
					</button>
				</div>
				<div className={'col-span-2 flex items-center justify-center gap-2 md:hidden'}>
					<Button
						onClick={async () => onAction({tokenAddress: props.vault.address})}
						className={'!h-10 w-full'}>
						{'Withdraw'}
					</Button>
					<Button
						onClick={async () =>
							onAction({tokenAddress: props.vault.token.address, vaultAddress: props.vault.address})
						}
						className={'!h-10 w-full'}>
						{'Deposit'}
					</Button>
				</div>
			</div>
		</div>
	);
}
