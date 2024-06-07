import {type ReactElement, useMemo} from 'react';
import {serialize} from 'wagmi';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {toAddress, toNormalizedBN, toNormalizedValue} from '@builtbymom/web3/utils';
import {useDeepCompareMemo} from '@react-hookz/web';
import {Counter} from '@lib/common/Counter';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {IconPlus} from '@lib/icons/IconPlus';
import {Button} from '@lib/primitives/Button';

import {AllowancesFilters} from './AllowancesFilters';
import {AllowancesTable} from './AllowancesTable';
import {useAllowances} from './useAllowances';

import type {TToken} from '@builtbymom/web3/types';

export function Revoke(): ReactElement {
	const {chainID} = useChainID();
	const {onOpenCurtain} = useBalancesCurtain();
	const {dispatchConfiguration, allowances} = useAllowances();

	/**********************************************************************************************
	 ** We take all unique tokens from allowances and form TToken array to get prices for them.
	 *********************************************************************************************/
	const uniqueAllowancesByToken: TToken[] = useMemo(() => {
		return [
			...new Map(
				allowances?.map(item => [
					item.address,
					{
						address: toAddress(item.address),
						name: item.name,
						symbol: item.symbol,
						decimals: item.decimals,
						chainID: item.chainID,
						value: toNormalizedBN(item.args.value as bigint, item.decimals).normalized,
						balance: item.balanceOf
					}
				])
			).values()
		];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serialize(allowances)]);

	const {data: prices, isLoading} = usePrices({
		tokens: uniqueAllowancesByToken ? uniqueAllowancesByToken : [],
		chainId: chainID
	});

	/**********************************************************************************************
	 ** We summarize all allowances values multiplied by their prices to get total value at risk.
	 *********************************************************************************************/
	const totalValueAtRisk = useDeepCompareMemo(() => {
		if (!prices || isLoading || !allowances) {
			return 0;
		}

		const total = allowances.reduce((sum, curr) => {
			const amountInUSD =
				toNormalizedValue(curr.args.value as bigint, curr.decimals) > curr.balanceOf.normalized
					? curr.balanceOf.normalized * prices[toAddress(curr.address)].normalized
					: toNormalizedValue(curr.args.value as bigint, curr.decimals) *
						prices[toAddress(curr.address)].normalized;
			return sum + amountInUSD;
		}, 0);

		return total;
	}, [allowances, isLoading, prices]);

	/**********************************************************************************************
	 ** This function opens curtain to choose extra tokens to check.
	 *********************************************************************************************/
	const handleOpenCurtain = (): void => {
		onOpenCurtain(selected => dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: selected}), {
			chainID: chainID,
			withTabs: true
		});
	};

	return (
		<div className={'w-full'}>
			<Button
				className={'!h-10'}
				onClick={handleOpenCurtain}>
				<IconPlus className={'mr-2 size-3'} />
				{'Add token'}
			</Button>

			<div className={'mt-6 w-min'}>
				<p className={'whitespace-nowrap text-sm font-bold text-neutral-900'}>{'Total Value at Risk'}</p>
				<div className={'text-[40px] font-semibold text-neutral-900'}>
					{totalValueAtRisk > 0 && totalValueAtRisk < 0.01 ? (
						<p>{'<$0.01'}</p>
					) : (
						<p>
							{'$'}
							<Counter
								value={totalValueAtRisk}
								decimals={2}
								shouldBeStylized
							/>
						</p>
					)}
				</div>
			</div>

			<AllowancesFilters />
			<AllowancesTable
				handleOpenCurtain={handleOpenCurtain}
				prices={prices}
			/>
		</div>
	);
}
