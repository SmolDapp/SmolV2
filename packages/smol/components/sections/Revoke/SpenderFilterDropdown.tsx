'use client';
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuSeparator
} from 'packages/lib/primitives/DropdownMenu';
import {truncateHex} from '@builtbymom/web3/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import {useAllowances} from './useAllowances';

import type {TExpandedAllowance} from 'packages/lib/utils/types/app.revoke';
import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

export type TFilterAllowance = Pick<TExpandedAllowance, 'symbol' | 'address' | 'blockHash' | 'args'> & {
	displayName?: TAddress | string;
};

export const SpenderFilterDropdown = (props: {
	children: React.ReactElement;
	allOptions: TFilterAllowance[];
}): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {children, allOptions} = props;
	const spenderFilter = configuration.allowancesFilters.spender.filter;

	return (
		<DropdownMenu.Root modal>
			<DropdownMenu.Trigger>{children}</DropdownMenu.Trigger>
			<DropdownMenuContent className={'absolute left-0 !min-w-[200px] p-2'}>
				<div className={'pl-2'}>
					<p className={'text-xs font-bold'}>{'Select Spender'}</p>
				</div>
				<DropdownMenuSeparator className={'my-3'} />

				{allOptions?.map(option => (
					<DropdownMenuCheckboxItem
						key={option.blockHash}
						checked={spenderFilter?.some(item => item === option.args.sender)}
						onCheckedChange={() => {
							if (!spenderFilter?.some(item => item === option.args.sender)) {
								dispatchConfiguration({
									type: 'SET_FILTER',
									payload: {
										...configuration.allowancesFilters,
										spender: {
											filter: [...(spenderFilter ?? []), option.args.sender]
										}
									}
								});
							} else {
								const filteredOptions = spenderFilter.filter(item => item !== option.args.sender);
								dispatchConfiguration({
									type: 'SET_FILTER',
									payload: {
										...configuration.allowancesFilters,
										spender: {filter: filteredOptions}
									}
								});
							}
						}}>
						{truncateHex(option.args.sender, 7)}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
