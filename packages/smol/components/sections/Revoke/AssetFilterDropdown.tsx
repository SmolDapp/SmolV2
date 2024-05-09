'use client';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator
} from 'packages/lib/primitives/DropdownMenu';
import {isAddress, truncateHex} from '@builtbymom/web3/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import {type TExpandedAllowance, useAllowances} from './useAllowances';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

export type TFilterAllowance = Pick<TExpandedAllowance, 'symbol' | 'address' | 'blockHash' | 'args'> & {
	displayName?: TAddress | string;
};

export const AssetFilterDropdown = (props: {
	children: React.ReactElement;
	selectedOptions: TFilterAllowance[];
	set_selectedOptions: Dispatch<SetStateAction<TFilterAllowance[]>>;
	allOptions: TFilterAllowance[];
	filterBy: 'asset' | 'spender';
}): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {children, selectedOptions, set_selectedOptions, allOptions, filterBy} = props;

	return (
		<DropdownMenu.Root modal>
			<DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
			<DropdownMenuContent className={'absolute left-0 !min-w-[200px] p-2'}>
				<div className={'pl-2'}>
					<p className={'text-xs font-bold'}>{filterBy === 'asset' ? 'Select Asset' : 'Select Spender'}</p>
				</div>
				<DropdownMenuSeparator className={'my-3'} />

				{allOptions?.map(option => (
					<DropdownMenuCheckboxItem
						key={option.blockHash}
						checked={selectedOptions.some(item => item.address === option.address)}
						onCheckedChange={() => {
							if (!selectedOptions.some(item => item.address === option.address)) {
								set_selectedOptions(prev => [...prev, option]);
								dispatchConfiguration({
									type: 'SET_FILTER',
									payload: {
										...configuration.allowancesFilters,
										[filterBy]: {
											filter: [
												...selectedOptions.map(item => item.address),
												filterBy === 'asset' ? option.address : option.args.sender
											]
										}
									}
								});
							} else {
								const filteredOptions = props.selectedOptions.filter(
									item => item.address !== option.address
								);
								set_selectedOptions(filteredOptions);
								dispatchConfiguration({
									type: 'SET_FILTER',
									payload: {
										...configuration.allowancesFilters,
										[filterBy]: {filter: filteredOptions.map(item => item.address)}
									}
								});
							}
						}}>
						{isAddress(option.displayName) ? truncateHex(option.displayName, 5) : option.displayName}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
