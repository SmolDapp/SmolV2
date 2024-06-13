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
				return <IconChevronPlain className={'size-4 min-w-[16px] cursor-pointer text-neutral-800'} />;
			}
			if (shouldSortBy && props.sortDirection === 'asc') {
				return (
					<IconChevronPlain className={'size-4 min-w-[16px] rotate-180 cursor-pointer text-neutral-800'} />
				);
			}
			return (
				<IconChevronPlain
					className={
						'size-4 min-w-[16px] cursor-pointer text-neutral-600 transition-colors group-hover:text-neutral-800'
					}
				/>
			);
		},
		[props.sortDirection]
	);

	return (
		<div className={'mb-4 hidden w-full grid-cols-12 border-neutral-200 pr-4 text-xs md:grid'}>
			<p className={'col-span-5 flex flex-row items-center justify-between font-medium'}>{props.title}</p>
			<div className={'col-span-7 grid grid-cols-8 gap-x-7 text-neutral-600'}>
				{props.items.map(item =>
					item.isSortable ? (
						<button
							key={item.value}
							onClick={(): void => props.onSort(item.value, toggleSortDirection(item.value))}
							className={'group col-span-2 flex flex-row items-center justify-end transition-colors'}>
							<p
								className={
									props.sortBy === item.value
										? 'text-neutral-800'
										: 'text-neutral-600 group-hover:text-neutral-800'
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
