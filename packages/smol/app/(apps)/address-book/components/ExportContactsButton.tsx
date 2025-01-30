'use client';

import Papa from 'papaparse';
import {useCallback} from 'react';

import {useAddressBook} from '@lib/contexts/useAddressBook';
import {IconImport} from '@lib/icons/IconImport';
import {cl} from '@lib/utils/helpers';

import type {ReactElement} from 'react';

export function ExportContactsButton(): ReactElement {
	const {listEntries} = useAddressBook();

	const downloadEntries = useCallback(async () => {
		const entries = await listEntries();
		const clonedEntries = structuredClone(entries);
		//Remove id and ens from the entries
		const entriesWithoutId = clonedEntries
			.filter(entry => !entry.isHidden)
			.map(entry => {
				return {
					address: entry.address,
					label: entry.label,
					chains: entry.chains,
					isFavorite: entry.isFavorite
				};
			});
		const csv = Papa.unparse(entriesWithoutId, {header: true});
		const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		const name = `smol-address-book-${new Date().toISOString().split('T')[0]}.csv`;
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', name);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}, [listEntries]);

	return (
		<button
			onClick={downloadEntries}
			className={cl(
				'rounded-lg p-2 text-xs flex flex-row items-center',
				'bg-neutral-300 text-neutral-900 transition-colors hover:bg-neutral-400'
			)}>
			<IconImport className={'mr-2 size-3 rotate-180 text-neutral-900'} />
			{'Download Contacts'}
		</button>
	);
}
