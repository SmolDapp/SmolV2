'use client';
import {type ReactElement, useCallback, useMemo} from 'react';
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
	const {children} = props;
	const assetFilter = useMemo(() => configuration.allowancesFilters.asset.filter, [configuration.allowancesFilters]);

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
		return props.allOptions?.map(option => (
			<DropdownMenuCheckboxItem
				key={`${option.address}-${option.chainID}`}
				checked={assetFilter?.some(item => item === option.address)}
				onCheckedChange={() => onCheckedChange(option)}>
				{option.symbol}
			</DropdownMenuCheckboxItem>
		));
	}, [assetFilter, onCheckedChange, props.allOptions]);

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
