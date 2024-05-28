import {type ReactElement, useCallback, useMemo, useState} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {formatAmount, toAddress, toNormalizedBN} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {IconPlus} from '@lib/icons/IconPlus';
import {IconSpinner} from '@lib/icons/IconSpinner';
import {Button} from '@lib/primitives/Button';
import {isDev} from '@lib/utils/tools.chains';
import {isUnlimitedNumber} from '@lib/utils/tools.revoke';

import {AllowancesFilters} from './AllowancesFilters';
import {AllowancesTable} from './AllowancesTable';
import {useAllowances} from './useAllowances';
import {RevokeWizard} from './Wizard';

import type {TAddress, TToken} from '@builtbymom/web3/types';
import type {TTokenAllowance} from '@lib/types/Revoke';

export function Revoke(): ReactElement {
	const {chainID, safeChainID} = useChainID();
	const [revokeStatus, set_revokeStatus] = useState(defaultTxStatus);
	const {onOpenCurtain} = useBalancesCurtain();
	const {provider} = useWeb3();
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
	const totalValueAtRist = useDeepCompareMemo(() => {
		if (isLoading) {
			return (
				<span className={'mt-2 flex w-full justify-center'}>
					<IconSpinner />
				</span>
			);
		}
		if (!prices) {
			return 'N/A';
		}

		const total = uniqueAllowancesByToken.reduce((acc, curr) => {
			const val = isUnlimitedNumber(curr.value)
				? curr.balance.normalized * prices[toAddress(curr.address)].normalized
				: curr.value * prices[toAddress(curr.address)].normalized;
			return acc + val;
		}, 0);

		const formattedTotal = formatAmount(total, 2);

		return `$${formattedTotal}`;
	}, [isLoading, prices, uniqueAllowancesByToken]);

	/**********************************************************************************************
	 ** This function calls approve contract and sets 0 for approve amount. Simply it revokes the
	 ** allowance.
	 *********************************************************************************************/
	const revokeTokenAllowance = useCallback(
		async (tokenToRevoke: TTokenAllowance, spender: TAddress): Promise<void> => {
			if (!tokenToRevoke) {
				return;
			}
			dispatchConfiguration({type: 'SET_ALLOWANCE_TO_REVOKE', payload: {...tokenToRevoke, spender}});
			await approveERC20({
				contractAddress: tokenToRevoke.address,
				chainID: isDev ? chainID : safeChainID,
				connector: provider,
				spenderAddress: spender,
				amount: 0n,
				statusHandler: set_revokeStatus
			});
		},
		[chainID, dispatchConfiguration, provider, safeChainID]
	);

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
				<p className={'text-[40px] font-semibold text-neutral-900'}>{totalValueAtRist}</p>
			</div>

			<AllowancesFilters />
			<AllowancesTable
				prices={prices}
				revoke={revokeTokenAllowance}
			/>
			<RevokeWizard
				revokeStatus={revokeStatus}
				set_revokeStatus={set_revokeStatus}
			/>
		</div>
	);
}
