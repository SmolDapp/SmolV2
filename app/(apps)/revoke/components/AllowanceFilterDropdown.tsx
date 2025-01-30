'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {useCallback, useMemo} from 'react';

import {DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator} from '@lib/components/DropdownMenu';
import {ImageWithFallback} from '@lib/components/ImageWithFallback';
import {useTokenList} from '@lib/contexts/WithTokenList';
import {useAllowances} from 'app/(apps)/revoke/contexts/useAllowances';

import type {TFilterAllowance} from 'app/(apps)/revoke/types';
import type {ReactElement} from 'react';

/**********************************************************************************************
 ** Props for the AllowanceFilterDropdown component
 ** @param children - React element to be used as the dropdown trigger
 ** @param allOptions - Array of allowance options to display in the dropdown
 ** @param type - Type of filter ('asset' or 'spender')
 ** @param title - Title to display at the top of the dropdown menu
 *********************************************************************************************/
type TAllowanceFilterDropdownProps = {
	children: React.ReactElement;
	allOptions: TFilterAllowance[];
	type: 'asset' | 'spender';
	title: string;
};

/**********************************************************************************************
 ** A unified dropdown component for filtering both assets and spenders in the allowances list.
 ** Handles both asset and spender filtering through a single reusable interface.
 *********************************************************************************************/
export const AllowanceFilterDropdown = ({
	children,
	allOptions,
	type,
	title
}: TAllowanceFilterDropdownProps): ReactElement => {
	const {dispatchConfiguration, configuration} = useAllowances();
	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** Memoized current filter value based on the dropdown type (asset or spender)
	 ** Returns the appropriate filter array from the configuration
	 *********************************************************************************************/
	const currentFilter = useMemo(
		() =>
			type === 'asset'
				? configuration.allowancesFilters.asset.filter
				: configuration.allowancesFilters.spender.filter,
		[configuration.allowancesFilters, type]
	);

	/**********************************************************************************************
	 ** Handles the checkbox state changes in the dropdown
	 ** Adds or removes items from the filter based on their checked state
	 ** @param option - The allowance option being toggled
	 *********************************************************************************************/
	const onCheckedChange = useCallback(
		(option: TFilterAllowance): void => {
			const filterValue = type === 'asset' ? option.address : option.spenderName;
			if (!currentFilter?.some(item => item === filterValue)) {
				dispatchConfiguration({
					type: 'SET_FILTER',
					payload: {
						...configuration.allowancesFilters,
						[type]: {
							filter: [...(currentFilter ?? []), filterValue]
						}
					}
				});
			} else {
				const filteredOptions = currentFilter.filter(item => item !== filterValue);
				dispatchConfiguration({
					type: 'SET_FILTER',
					payload: {
						...configuration.allowancesFilters,
						[type]: {filter: filteredOptions}
					}
				});
			}
		},
		[currentFilter, configuration.allowancesFilters, dispatchConfiguration, type]
	);

	/**********************************************************************************************
	 ** Memoized dropdown items list
	 ** Renders different item layouts for assets (with images) and spenders (text only)
	 ** For assets, includes token images and handles cases where tokens aren't in the token list
	 *********************************************************************************************/
	const dropdownItems = useMemo(() => {
		return allOptions?.map(option => {
			const filterValue = type === 'asset' ? option.address : option.spenderName;
			const isChecked = currentFilter?.some(item => item === filterValue);

			if (type === 'asset') {
				const tokenFromList = getToken({chainID: option.chainID, address: option.address});
				return (
					<DropdownMenuCheckboxItem
						key={`${option.address}-${option.chainID}`}
						checked={isChecked}
						onCheckedChange={() => onCheckedChange(option)}
						disabled={!tokenFromList}>
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
			}

			return (
				<DropdownMenuCheckboxItem
					key={`${option.address}-${option.chainID}`}
					checked={isChecked}
					onCheckedChange={() => onCheckedChange(option)}>
					{option.spenderName}
				</DropdownMenuCheckboxItem>
			);
		});
	}, [allOptions, currentFilter, getToken, onCheckedChange, type]);

	return (
		<DropdownMenu.Root modal>
			<DropdownMenu.Trigger
				disabled={allOptions?.length === 0}
				className={'disabled:cursor-not-allowed'}>
				{children}
			</DropdownMenu.Trigger>

			<DropdownMenuContent className={'absolute left-0 !min-w-[200px] p-2'}>
				<div className={'pl-2'}>
					<p className={'text-xs font-bold'}>{title}</p>
				</div>
				<DropdownMenuSeparator className={'my-3'} />

				{dropdownItems}
			</DropdownMenuContent>
		</DropdownMenu.Root>
	);
};
