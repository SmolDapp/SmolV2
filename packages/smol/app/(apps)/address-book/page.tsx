'use client';

import {IconEmptyAddressBook} from '@lib/icons/IconEmptyAddressBook';
import {TextInput} from '@lib/primitives/TextInput';
import {LayoutGroup, motion} from 'framer-motion';
import {toAddress} from 'lib/utils/tools.addresses';
import {useMemo, useState} from 'react';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {AddContactButton} from 'packages/smol/app/(apps)/address-book/components/AddContactButton';
import {AddressBookActions} from 'packages/smol/app/(apps)/address-book/components/AddressBookActions';
import {EmptyAddressBook} from 'packages/smol/app/(apps)/address-book/components/EmptyAddressBook';
import {AddressBookEntry} from 'packages/smol/common/AddressBookEntry';

import type {ReactElement} from 'react';

export default function AddressBookPage(): ReactElement {
	const {listCachedEntries} = useAddressBook();
	const {setCurtainStatus, dispatchConfiguration} = useAddressBook();
	const [searchValue, setSearchValue] = useState('');

	/**************************************************************************
	 * Memo function that filters the entries in the address book based on
	 * the search value.
	 * Only entries the label or the address of which includes the search value
	 * will be returned.
	 *************************************************************************/
	const filteredEntries = useMemo(() => {
		return listCachedEntries()
			.filter(entry => !entry.isHidden)
			.filter(
				entry =>
					entry.label.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
					toAddress(entry.address).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
			);
	}, [listCachedEntries, searchValue]);

	/**************************************************************************
	 * Memo function that sorts the entries in the address book, with the
	 * following priority:
	 * - favorite entries first
	 * - alphabetical order
	 *************************************************************************/
	const entries = useMemo(() => {
		return filteredEntries.sort((a, b) => {
			if (a.isFavorite && !b.isFavorite) {
				return -1;
			}
			if (!a.isFavorite && b.isFavorite) {
				return 1;
			}
			return a.label.localeCompare(b.label);
		});
	}, [filteredEntries]);

	const hasNoEntries = listCachedEntries().filter(entry => !entry.isHidden).length === 0;
	const hasNoFilteredEntry = entries.length === 0;

	return (
		<div className={'max-w-108'}>
			{hasNoEntries ? (
				<div className={'w-444 md:h-content md:min-h-content'}>
					<EmptyAddressBook onOpenCurtain={() => setCurtainStatus({isOpen: true, isEditing: true})} />
				</div>
			) : (
				<div className={'w-444'}>
					<div className={'my-4 grid gap-4'}>
						<AddressBookActions onOpenCurtain={() => setCurtainStatus({isOpen: true, isEditing: true})} />
						<TextInput
							placeholder={'Search ...'}
							value={searchValue}
							onChange={setSearchValue}
						/>
					</div>
					<LayoutGroup>
						<motion.div
							layout
							className={'mt-2'}>
							{entries.map(entry => (
								<motion.div
									layout
									initial={'initial'}
									key={`${entry.address}${entry.id}`}>
									<AddressBookEntry
										entry={entry}
										onSelect={selected => {
											dispatchConfiguration({type: 'SET_SELECTED_ENTRY', payload: selected});
											setCurtainStatus({isOpen: true, isEditing: false});
										}}
									/>
								</motion.div>
							))}
							{hasNoFilteredEntry && (
								<div
									className={
										'flex flex-col items-center justify-center rounded-lg bg-neutral-200 px-11 py-[72px]'
									}>
									<div
										className={
											'bg-neutral-0 mb-6 flex size-40 items-center justify-center rounded-full'
										}>
										<IconEmptyAddressBook />
									</div>
									<div className={'flex flex-col items-center justify-center'}>
										<p className={'text-center text-base text-neutral-600'}>
											{`We couldn't find any contact matching "${searchValue}".`}
										</p>
										<div className={'flex flex-row gap-x-2 pt-6'}>
											<AddContactButton
												label={`Add ${searchValue}`}
												onOpenCurtain={() =>
													setCurtainStatus({
														isOpen: true,
														isEditing: true,
														label: searchValue
													})
												}
											/>
										</div>
									</div>
								</div>
							)}
						</motion.div>
					</LayoutGroup>
				</div>
			)}
		</div>
	);
}
