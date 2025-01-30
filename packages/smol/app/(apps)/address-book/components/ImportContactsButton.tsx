'use client';

import {usePlausible} from 'next-plausible';
import Papa from 'papaparse';

import {useAddressBook} from '@lib/contexts/useAddressBook';
import {IconImport} from '@lib/icons/IconImport';
import {cl} from '@lib/utils/helpers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {toAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TAddressBookEntry} from 'packages/smol/app/(apps)/address-book/types';
import type {ChangeEvent, ReactElement} from 'react';

export function ImportContactsButton(props: {className?: string}): ReactElement {
	const plausible = usePlausible();
	const {addEntry} = useAddressBook();

	const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
		if (!e.target.files) {
			return;
		}
		const [file] = e.target.files as unknown as Blob[];
		const reader = new FileReader();
		reader.onload = event => {
			if (!event?.target?.result) {
				return;
			}
			const {result} = event.target;
			const parsedCSV = Papa.parse(result, {header: true});
			let records: TAddressBookEntry[] = [];

			// If we are working with a safe file, we should get 3 columns.
			const isProbablySafeFile = parsedCSV.meta.fields.length === 3;
			if (isProbablySafeFile) {
				const [addressLike, name, chainID] = parsedCSV.meta.fields;
				records = parsedCSV.data.map((item: unknown[]) => {
					return {
						address: item[addressLike] as TAddress,
						label: item[name] as string,
						chains: [item[chainID]] as number[]
					};
				});
			}
			// If we are working with a smol file, we should get 4 columns.
			const isProbablySmolFile = parsedCSV.meta.fields.length === 4;
			if (isProbablySmolFile) {
				const [addressLike, name, chains, isFavorite] = parsedCSV.meta.fields;
				records = parsedCSV.data.map((item: unknown[]) => {
					const chainIDs = ((item[chains] as string) || '').split(',').map(chain => Number(chain));
					const uniqueChainIDs = [...new Set(chainIDs)];
					const entryLabel = ((item[name] as string) || '').replaceAll('.', '-');

					return {
						address: item[addressLike] as TAddress,
						label: entryLabel,
						chains: uniqueChainIDs,
						isFavorite: Boolean(item[isFavorite] === 'true' || item[isFavorite] === true),
						isHidden: false
					};
				});
			}

			// On theses records, we might have the same address multiple times.
			// If that's the case, we want to merge the chains and only keep one entry.
			const mergedRecords = records.reduce((acc: TAddressBookEntry[], cur: TAddressBookEntry) => {
				const existingRecord = acc.find(item => item.address === cur.address);
				if (existingRecord) {
					existingRecord.chains = [...existingRecord.chains, ...cur.chains];
					return acc;
				}
				return [...acc, cur];
			}, []);

			// The name should always be unique. We need to check if we have duplicates.
			// If that's the case, we need to add a slice of the address to the name, but
			// we still keep both entries.
			const uniqueRecords = mergedRecords.reduce((acc: TAddressBookEntry[], cur: TAddressBookEntry) => {
				const existingRecord = acc.find(item => item.label === cur.label);
				if (existingRecord) {
					const existingSlice = toAddress(existingRecord.address).slice(0, 6);
					existingRecord.label = `${existingRecord.label} (${existingSlice})`;

					const curSlice = toAddress(cur.address).slice(0, 6);
					cur.label = `${cur.label} (${curSlice})`;
					return [...acc, cur];
				}
				return [...acc, cur];
			}, []);

			for (const record of uniqueRecords) {
				record.label = record.label.replaceAll('.', '-'); // Dots are not allowed in the label
				record.label = record.label.replaceAll('0x', 'Ox'); // We don't want to start with 0x
				record.label = record.label.length > 22 ? record.label.slice(0, 22) : record.label;
				addEntry(record);
			}
		};
		reader.readAsBinaryString(file);
	};

	return (
		<button
			onClick={() => {
				plausible(PLAUSIBLE_EVENTS.AB_IMPORT_CONTACTS);
				document.querySelector<HTMLInputElement>('#file-upload')?.click();
			}}
			className={cl(
				props.className,
				'rounded-lg p-2 text-xs flex flex-row items-center relative overflow-hidden',
				'bg-neutral-300 text-neutral-900 transition-colors hover:bg-neutral-400'
			)}>
			<input
				id={'file-upload'}
				tabIndex={-1}
				className={'absolute inset-0 !cursor-pointer opacity-0'}
				type={'file'}
				accept={'.csv'}
				onClick={event => event.stopPropagation()}
				onChange={handleFileUpload}
			/>
			<IconImport className={'mr-2 size-3 text-neutral-900'} />
			{'Import Contacts'}
		</button>
	);
}
