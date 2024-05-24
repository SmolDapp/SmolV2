'use client';
import {type ReactElement, useCallback} from 'react';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator
} from 'packages/lib/primitives/DropdownMenu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import {useAllowances} from './useAllowances';

import type {TFilterAllowance} from '@lib/types/Revoke';

export const AssetFilterDropdown = (props: {
	children: React.ReactElement;
	allOptions: TFilterAllowance[];
}): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {children, allOptions} = props;
	const assetFilter = configuration.allowancesFilters.asset.filter;

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

	return (
		<DropdownMenu.Root modal>
			<DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
			<DropdownMenuContent className={'absolute left-0 !min-w-[200px] p-2'}>
				<div className={'pl-2'}>
					<p className={'text-xs font-bold'}>{'Select Asset'}</p>
				</div>
				<DropdownMenuSeparator className={'my-3'} />

				{allOptions?.map(option => (
					<DropdownMenuCheckboxItem
						key={`${option.address}-${option.chainID}`}
						checked={assetFilter?.some(item => item === option.address)}
						onCheckedChange={() => onCheckedChange(option)}>
						{option.symbol}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
