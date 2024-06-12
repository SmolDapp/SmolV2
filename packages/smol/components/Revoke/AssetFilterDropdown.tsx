'use client';
import {type ReactElement, useCallback, useMemo} from 'react';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator
} from 'packages/lib/primitives/DropdownMenu';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';

import {useAllowances} from './useAllowances';

import type {TFilterAllowance} from '@lib/types/app.revoke';

export const AssetFilterDropdown = (props: {
	children: React.ReactElement;
	allOptions: TFilterAllowance[];
}): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {children} = props;
	const assetFilter = useMemo(() => configuration.allowancesFilters.asset.filter, [configuration.allowancesFilters]);

	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** This function changes options to checked or unchecked to be able to filter allowances
	 ** by token.
	 *********************************************************************************************/
	const onCheckedChange = useCallback(
		(option: TFilterAllowance): void => {
			if (!assetFilter?.some(item => item === option.address)) {
				dispatchConfiguration({
					type: 'SET_FILTER',
					payload: {
						...configuration.allowancesFilters,
						asset: {
							filter: [...(assetFilter ?? []), option.address]
						}
					}
				});
			} else {
				const filteredOptions = assetFilter.filter(item => item !== option.address);
				dispatchConfiguration({
					type: 'SET_FILTER',
					payload: {
						...configuration.allowancesFilters,
						asset: {filter: filteredOptions}
					}
				});
			}
		},
		[assetFilter, configuration.allowancesFilters, dispatchConfiguration]
	);

	const allOptions = useMemo(() => {
		return props.allOptions?.map(option => {
			const tokenFromList = getToken({chainID: option.chainID, address: option.address});

			return (
				<DropdownMenuCheckboxItem
					key={`${option.address}-${option.chainID}`}
					checked={assetFilter?.some(item => item === option.address)}
					onCheckedChange={() => onCheckedChange(option)}>
					<ImageWithFallback
						alt={option.symbol}
						unoptimized
						src={
							tokenFromList?.logoURI ||
							`${process.env.SMOL_ASSETS_URL}/token/${option.chainID}/${option.address}/logo-32.png`
						}
						quality={90}
						width={14}
						height={14}
					/>
					<p className={'ml-1'}>{option.symbol}</p>
				</DropdownMenuCheckboxItem>
			);
		});
	}, [assetFilter, getToken, onCheckedChange, props.allOptions]);

	return (
		<DropdownMenu.Root modal>
			<DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
			<DropdownMenuContent className={'absolute left-0 !min-w-[200px] p-2'}>
				<div className={'pl-2'}>
					<p className={'text-xs font-bold'}>{'Select Asset'}</p>
				</div>
				<DropdownMenuSeparator className={'my-3'} />

				{allOptions}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
