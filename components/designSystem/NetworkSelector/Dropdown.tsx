'use client';

import React, {useState} from 'react';
import {DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator} from 'components/Primitives/DropdownMenu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {supportedNetworks} from '@utils/tools.chains';
import {IconChevronBottom} from '@yearn-finance/web-lib/icons/IconChevronBottom';
import {cl} from '@yearn-finance/web-lib/utils/cl';

import type {ReactElement} from 'react';
import type {TNDict} from '@yearn-finance/web-lib/types';

export function NetworkDropdownSelector(props: {value: number[]; onChange: (value: number[]) => void}): ReactElement {
	/**************************************************************************
	 * If some networks are passed as props, we want to use them. As we are
	 * using a TNDict to store the selected networks, we need to convert the
	 * array of networks into a TNDict.
	 *************************************************************************/
	const [selectedNetworks, set_selectedNetworks] = useState<TNDict<boolean>>(
		props.value.reduce((acc, networkId) => {
			acc[networkId] = true;
			return acc;
		}, {} as TNDict<boolean>)
	);

	/**************************************************************************
	 * All the networks are selected if all the values in the object are set to
	 * true and the length of the object is equal to the length of the
	 * supported networks.
	 *************************************************************************/
	const areAllSelected =
		Object.values(selectedNetworks).every(Boolean) &&
		Object.keys(selectedNetworks).length === supportedNetworks.length;

	/**************************************************************************
	 * In the fake input box, we want to display the name of the selected
	 * networks. To do so, we filter the selected networks and map them to
	 * their name.
	 *************************************************************************/
	const selectedNetworksName = Object.entries(selectedNetworks)
		.filter(([, isSelected]) => isSelected)
		.map(([networkId]) => supportedNetworks.find(network => network.id === Number(networkId))?.name)
		.join(', ');

	return (
		<DropdownMenu.Root
			onOpenChange={isOpen => {
				if (!isOpen) {
					props.onChange(Object.keys(selectedNetworks).map(Number));
				}
			}}>
			<DropdownMenu.Trigger asChild>
				<div
					className={cl(
						'w-full rounded-lg bg-transparent py-3 pl-4 pr-8 relative text-xs group',
						selectedNetworksName ? 'text-neutral-900' : 'text-neutral-600',
						'placeholder:text-neutral-600 caret-neutral-700',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors',
						'focus:border-neutral-600 border border-neutral-400',
						'cursor-pointer'
					)}>
					<p>{selectedNetworksName || 'Select chains'}</p>
					<span className={'absolute inset-y-0 right-2 flex h-full items-center justify-center'}>
						<IconChevronBottom
							className={'h-4 w-4 text-neutral-600 transition-colors group-hover:text-neutral-900'}
						/>
					</span>
				</div>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenuContent>
					<DropdownMenuCheckboxItem
						checked={areAllSelected}
						onCheckedChange={() => {
							set_selectedNetworks(
								supportedNetworks.reduce((acc, network) => {
									acc[network.id] = areAllSelected ? false : true;
									return acc;
								}, {} as TNDict<boolean>)
							);
						}}>
						{'Select all'}
					</DropdownMenuCheckboxItem>
					<DropdownMenuSeparator />
					{supportedNetworks.map(network => (
						<DropdownMenuCheckboxItem
							checked={selectedNetworks[network.id]}
							onCheckedChange={() =>
								set_selectedNetworks(prev => ({...prev, [network.id]: !prev[network.id]}))
							}>
							{network.name}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
