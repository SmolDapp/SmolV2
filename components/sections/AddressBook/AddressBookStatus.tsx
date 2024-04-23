import {type ReactElement, useEffect, useMemo} from 'react';
import {useAddressBook} from 'contexts/useAddressBook';
import {type TWarningType, Warning} from '@common/Primitives/Warning';

export const AddressBookStatus = (): ReactElement | null => {
	const {selectedEntry} = useAddressBook();
	const {getCachedEntry} = useAddressBook();

	const entry = getCachedEntry({label: selectedEntry?.label});

	const status: {type: TWarningType; message: string | ReactElement} | null = useMemo(() => {
		if (entry !== undefined && selectedEntry?.id !== entry.id && !entry.isHidden) {
			return {
				message: 'This name is already used in your address book',
				type: 'error'
			};
		}

		if (selectedEntry?.label.length && selectedEntry?.label.length > 22) {
			return {message: 'The name cannot be longer than 22 characters', type: 'error'};
		}

		return null;
	}, [entry, selectedEntry?.id, selectedEntry?.label]);

	useEffect(() => {
		console.log(selectedEntry);
	}, [entry, selectedEntry, status]);

	if (!status) {
		return null;
	}
	return (
		<div className={'mt-4'}>
			<Warning
				message={status.message}
				type={status.type}
			/>
		</div>
	);
};
