import {type ReactElement, useMemo} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
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
	}, [allowances]);

	const {data: prices, isLoading} = usePrices({
		tokens: uniqueAllowancesByToken ? uniqueAllowancesByToken : [],
		chainId: chainID
	});

	/**********************************************************************************************
	 ** We summarize all allowances values multiplied by their prices to get total value at risk.
	 *********************************************************************************************/
	const totalValueAtRisk = useDeepCompareMemo(() => {
		if (!prices || isLoading) {
			return 0;
		}

		const total = uniqueAllowancesByToken.reduce((sum, curr) => {
			const amountInUSD =
				curr.value > curr.balance.normalized
					? curr.balance.normalized * prices[toAddress(curr.address)].normalized
					: curr.value * prices[toAddress(curr.address)].normalized;
			return sum + amountInUSD;
		}, 0);

		return total;
	}, [isLoading, prices, uniqueAllowancesByToken]);

	/**********************************************************************************************
	 ** This function opens curtain to choose extra tokens to check.
	 *********************************************************************************************/
	const handleOpenCurtain = (): void => {
		onOpenCurtain(selected => dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: selected}));
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
				<p className={'text-[40px] font-semibold text-neutral-900'}>
					{'$'}
					<Counter
						value={totalValueAtRisk}
						decimals={2}
					/>
				</p>
			</div>

			<AllowancesFilters />
			<AllowancesTable prices={prices} />
		</div>
	);
}
