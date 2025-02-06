import {AddContactButton} from 'app/(apps)/address-book/components/AddContactButton';
import {ExportContactsButton} from 'app/(apps)/address-book/components/ExportContactsButton';
import {ImportContactsButton} from 'app/(apps)/address-book/components/ImportContactsButton';

import type {ReactElement} from 'react';

export function AddressBookActions(props: {onOpenCurtain: VoidFunction}): ReactElement {
	return (
		<div className={'flex flex-row space-x-2'}>
			<AddContactButton onOpenCurtain={props.onOpenCurtain} />
			<ImportContactsButton />
			<ExportContactsButton />
		</div>
	);
}
