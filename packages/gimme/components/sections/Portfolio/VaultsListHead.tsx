import {type ReactElement, useCallback} from 'react';
import IconChevronPlain from '@lib/icons/IconChevronPlain';

import type {TSortDirection} from '@builtbymom/web3/types';

export function VaultsListHead(props: {
	sortBy: string;
	sortDirection: TSortDirection;
	onSort: (newSortDirection: string, newSortBy: string) => void;
	items: {label: string; value: string; isSortable: boolean}[];
	title: string;
}): ReactElement {
	const toggleSortDirection = (newSortBy: string): TSortDirection => {
		if (props.sortBy === newSortBy) {
			if (props.sortDirection === '') {
				return 'desc';
			}
			if (props.sortDirection === 'desc') {
				return 'asc';
			}
			if (props.sortDirection === 'asc') {
				return '';
			}
		}
		return 'desc';
	};

	const renderChevron = useCallback(
		(shouldSortBy: boolean): ReactElement => {
			if (shouldSortBy && props.sortDirection === 'desc') {
				return <IconChevronPlain className={'text-grey-800 size-4 min-w-[16px] cursor-pointer'} />;
			}
			if (shouldSortBy && props.sortDirection === 'asc') {
				return <IconChevronPlain className={'text-grey-800 size-4 min-w-[16px] rotate-180 cursor-pointer'} />;
			}
			return (
				<IconChevronPlain
					className={
						'text-grey-700 group-hover:text-grey-800 size-4 min-w-[16px] cursor-pointer transition-colors'
					}
				/>
			);
		},
		[props.sortDirection]
	);

	return (
		<div className={'mb-4 hidden w-full grid-cols-12 border-neutral-200 pr-4 text-xs md:grid'}>
			<p className={'text-grey-900 col-span-5 flex flex-row items-center justify-between font-medium'}>
				{props.title}
			</p>
			<div className={'text-grey-700 col-span-7 grid grid-cols-8 gap-x-7'}>
				{props.items.map(item =>
					item.isSortable ? (
						<button
							key={item.value}
							onClick={(): void => props.onSort(item.value, toggleSortDirection(item.value))}
							className={'group col-span-2 flex flex-row items-center justify-end transition-colors'}>
							<p
								className={
									props.sortBy === item.value
										? 'text-grey-800'
										: 'text-grey-700 group-hover:text-grey-800'
								}>
								{item.label}
							</p>

							{renderChevron(props.sortBy === item.value)}
						</button>
					) : (
						<div
							key={item.value}
							className={'col-span-2 flex flex-row items-center justify-end'}>
							{item.label}
						</div>
					)
				)}
			</div>
		</div>
	);
}
