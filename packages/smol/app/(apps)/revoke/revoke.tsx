import {IconPlus} from '@lib/icons/IconPlus';
import {Button} from '@lib/primitives/Button';
import {toNormalizedBN} from '@lib/utils/numbers';
import {toAddress} from 'lib/utils/tools.addresses';
import {Fragment, useMemo} from 'react';
import {serialize, useChainId} from 'wagmi';

import {useBalancesCurtain} from '@smolContexts/useBalancesCurtain';
import {usePrices} from '@smolContexts/WithPrices/WithPrices';
import {AllowancesFilters} from 'packages/smol/app/(apps)/revoke/components/AllowancesFilters';
import {AllowancesTable} from 'packages/smol/app/(apps)/revoke/components/AllowancesTable';
import {useAllowances} from 'packages/smol/app/(apps)/revoke/contexts/useAllowances';
import {getTotalAmountAtRisk} from 'packages/smol/app/(apps)/revoke/utils/tools.revoke';
import {Counter} from 'packages/smol/common/Counter';

import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

export function Revoke(): ReactElement {
	const chainID = useChainId();
	const {onOpenCurtain} = useBalancesCurtain();
	const {dispatchConfiguration, allowances} = useAllowances();

	/**********************************************************************************************
	 ** We take all unique tokens from allowances and form TERC20TokensWithBalance array to get prices for them.
	 *********************************************************************************************/
	const uniqueAllowancesByToken: TERC20TokensWithBalance[] = useMemo(() => {
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

	const {getPrices} = usePrices();
	const prices = useMemo(() => {
		if (uniqueAllowancesByToken.length === 0) {
			return {};
		}
		const pricesForChain = getPrices(uniqueAllowancesByToken);
		return pricesForChain[chainID] || {};
	}, [getPrices, uniqueAllowancesByToken, chainID]);

	const totalValueAtRisk = getTotalAmountAtRisk(allowances || [], prices);

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
		<Fragment>
			<div className={'-mt-2 flex flex-wrap gap-2 text-xs'}>
				<Button
					variant={'light'}
					className={'!h-8 !text-xs'}
					onClick={handleOpenCurtain}>
					<IconPlus className={'mr-2 size-3'} />
					{'Add token'}
				</Button>
			</div>

			<div className={'w-full'}>
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
		</Fragment>
	);
}
