import {type ReactElement, type ReactNode, useEffect, useMemo, useState} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useBlockNumber} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {type TDict, type TNormalizedBN} from '@builtbymom/web3/types';
import {toAddress, toBigInt, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {Counter} from '@gimmeDesignSystem/Counter';
import {readContracts} from '@wagmi/core';
import IconChevronPlain from '@lib/icons/IconChevronPlain';
import {IconLoader} from '@lib/icons/IconLoader';
import {VAULT_V3_ABI} from '@lib/utils/abi/vaultV3.abi';

import {VaultRow} from './VaultRow';

function EmptyView({isLoading = false}: {isLoading?: boolean}): ReactElement {
	return (
		<div
			className={
				'flex h-[248px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-600 text-neutral-600'
			}>
			{isLoading ? (
				<IconLoader className={'size-4 animate-spin text-neutral-900 transition-opacity'} />
			) : (
				<>
					<p>{'Your Portfolio is empty.'}</p>
					<p>{'Select Token at Earn section and add opportunity.'}</p>
				</>
			)}
		</div>
	);
}

export function Portfolio(): ReactNode {
	const {userVaults, userVaultsArray, isLoadingUserVaults} = useVaults();

	const {address, chainID} = useWeb3();
	const [balances, set_balances] = useState<TDict<TNormalizedBN>>({});
	const {data: blockNumber} = useBlockNumber({watch: true});

	const isEmpty = userVaultsArray.length === 0;
	const vaultTokenPrices = usePrices({
		tokens: userVaultsArray.map(vault => ({
			address: vault.token.address,
			chainID: vault.chainID,
			name: vault.token.name,
			symbol: vault.token.symbol,
			decimals: vault.token.decimals,
			balance: zeroNormalizedBN,
			value: 0
		})),
		chainId: chainID
	});

	const refetch = useAsyncTrigger(async (): Promise<void> => {
		blockNumber;
		const calls = [];

		if (userVaultsArray.length === 0) {
			return;
		}

		for (const vault of userVaultsArray) {
			const common = {abi: VAULT_V3_ABI, address: toAddress(vault.address), chainId: vault.chainID};
			calls.push({...common, functionName: 'balanceOf', args: [toAddress(address)]});
			calls.push({...common, functionName: 'pricePerShare'});
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const data = await readContracts(retrieveConfig(), {
			contracts: calls
		});

		const result: TDict<TNormalizedBN> = {};

		for (let i = 0; i < userVaultsArray.length; i++) {
			const iterator = i * 2;
			const {address} = userVaultsArray[i];

			const balanceOf = data[iterator].result as bigint;
			const pricePerShare = data[iterator + 1].result as bigint;

			result[address] = toNormalizedBN(
				(balanceOf * pricePerShare) / toBigInt(10 ** userVaultsArray[i].decimals),
				userVaultsArray[i].decimals
			);
		}

		set_balances(result);
	}, [address, userVaultsArray, blockNumber]);

	const totalDeposited = useMemo(() => {
		blockNumber;
		if (!userVaults || Object.values(balances).length === 0 || !vaultTokenPrices || userVaultsArray.length === 0) {
			return zeroNormalizedBN.normalized;
		}

		const balancesUsd = [];

		for (const balance in balances) {
			if (!userVaults[balance]) {
				continue;
			}

			const vaultTokenAddress = userVaults[balance].token.address;

			const usdValue =
				balances[balance].normalized * (vaultTokenPrices.data?.[vaultTokenAddress]?.normalized || 0);
			balancesUsd.push(usdValue);
		}

		return balancesUsd.reduce((acc, current) => current + acc, 0);
	}, [blockNumber, userVaults, balances, vaultTokenPrices, userVaultsArray.length]);

	const getLayout = (): ReactNode => {
		if (!address) {
			return <EmptyView />;
		}
		if (isLoadingUserVaults) {
			return <EmptyView isLoading />;
		}
		if (isEmpty) {
			return <EmptyView />;
		}

		return (
			<div className={'flex flex-col gap-2'}>
				{userVaultsArray.map(vault => (
					<VaultRow
						key={vault.address}
						vault={vault}
						price={vaultTokenPrices.data?.[vault.token.address]}
						balance={balances[vault.address] || zeroNormalizedBN}
					/>
				))}
			</div>
		);
	};

	useEffect(() => {
		refetch();
	}, [blockNumber, refetch]);

	return (
		<div className={'w-full max-w-6xl rounded-2xl bg-white p-8 shadow-xl'}>
			<div className={'font-medium'}>
				<p className={'mb-2 text-xs'}>{'Total Deposited'}</p>
				<p className={'text-4xl'}>
					{'$'}
					<Counter
						value={totalDeposited}
						decimals={18}
						decimalsToDisplay={[12]}
					/>
				</p>
			</div>
			<div className={'flex w-full flex-col'}>
				<div className={'mb-4 mt-12 grid w-full grid-cols-12 border-neutral-200 pr-4 text-xs'}>
					<p className={'col-span-5 flex flex-row items-center justify-between font-medium'}>
						{'Your Opportunities'}
					</p>
					<div className={'col-span-7 grid grid-cols-8 gap-x-7 text-neutral-600'}>
						<button
							className={
								'col-span-2 flex flex-row items-center justify-end transition-colors hover:text-neutral-800'
							}>
							{'APY'}
							<IconChevronPlain />
						</button>
						<button
							className={
								'col-span-2 flex items-center justify-end transition-colors hover:text-neutral-800'
							}>
							{'You have'}
							<IconChevronPlain />
						</button>
						<button
							className={
								'col-span-2 flex flex-row items-center justify-end transition-colors hover:text-neutral-800'
							}>
							{'Annual Yield'}
							<IconChevronPlain />
						</button>
						<div className={'col-span-2 flex flex-row items-center justify-end'}>{'Withdraw/Deposit'}</div>
					</div>
				</div>

				{getLayout()}
			</div>
		</div>
	);
}
