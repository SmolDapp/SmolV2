'use client';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator
} from 'packages/lib/primitives/DropdownMenu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TExpandedAllowance} from '@lib/types/Revoke';

export type TFilterAllowance = Pick<TExpandedAllowance, 'symbol' | 'address' | 'args'> & {
	displayName?: TAddress | string;
};

export const AssetFilterDropdown = (props: {
	children: React.ReactElement;
	allOptions: TFilterAllowance[];
}): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {children, allOptions} = props;
	const assetFilter = configuration.allowancesFilters.asset.filter;

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
						key={option.symbol}
						checked={assetFilter?.some(item => item === option.address)}
						onCheckedChange={() => {
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
						}}>
						{option.symbol}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
