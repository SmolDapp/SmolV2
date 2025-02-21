'use client';

import {IconAppAddressBook} from '@lib/components/icons/IconApps';
import {IconPlus} from '@lib/components/icons/IconPlus';
import {AddContactButton} from 'app/(apps)/address-book/components/AddContactButton';
import {ImportContactsButton} from 'app/(apps)/address-book/components/ImportContactsButton';

import type {ReactElement} from 'react';

export function EmptyAddressBook(props: {onOpenCurtain: VoidFunction}): ReactElement {
	return (
		<div className={'flex w-full flex-col items-center  rounded-lg bg-neutral-200 px-11 py-[72px]'}>
			<div className={'mb-6 flex size-40 items-center justify-center rounded-full bg-neutral-0'}>
				<div className={'relative flex size-40 items-center justify-center rounded-full bg-white'}>
					<IconAppAddressBook className={'size-20'} />
					<button
						onClick={props.onOpenCurtain}
						className={
							'absolute bottom-0 right-0 flex size-12 cursor-pointer items-center justify-center rounded-full bg-primary hover:bg-primaryHover'
						}>
						<IconPlus className={'size-4'} />
					</button>
				</div>
			</div>
			<div className={'flex flex-col items-center justify-center'}>
				<p className={'text-center text-base text-neutral-600'}>
					{'Your Address Book is empty. Add a contact manually or import your saved contacts'}
				</p>
				<div className={'flex flex-row gap-x-2 pt-6'}>
					<AddContactButton onOpenCurtain={props.onOpenCurtain} />
					<ImportContactsButton className={'!bg-neutral-0'} />
				</div>
			</div>
		</div>
	);
}
