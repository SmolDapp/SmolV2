import {type ReactElement, useMemo} from 'react';
import {useAddressBook} from 'contexts/useAddressBook';
import {type TWarningType, Warning} from '@common/Primitives/Warning';

export const AddressBookStatus = (): ReactElement | null => {
	const {selectedEntry} = useAddressBook();
	const {getCachedEntry} = useAddressBook();

	const entry = getCachedEntry({label: selectedEntry?.label});
	const addressEntry = getCachedEntry({address: selectedEntry?.address});
	const status: {type: TWarningType; message: string | ReactElement} | null = useMemo(() => {
		if (entry !== undefined && selectedEntry?.id !== entry.id && !entry.isHidden) {
			return {
				message: 'This name is already used in your address book',
				type: 'error'
			};
		}

		if (addressEntry !== undefined && addressEntry.id !== selectedEntry?.id && !addressEntry.isHidden) {
			return {
				message: 'This address is already in your address book',
				type: 'error'
			};
		}

		return null;
	}, [addressEntry, entry, selectedEntry?.id]);

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
