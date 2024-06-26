import {type ReactElement, useMemo} from 'react';
import {Warning} from '@lib/common/Warning';
import {useAddressBook} from '@lib/contexts/useAddressBook';

import type {TWarningType} from '@lib/common/Warning';
import type {TInputAddressLike} from '@lib/utils/tools.address';

export const AddressBookStatus = ({
	set_isFormValid,
	addressLike
}: {
	set_isFormValid: (value: boolean) => void;
	addressLike: TInputAddressLike;
}): ReactElement | null => {
	const {getCachedEntry, selectedEntry} = useAddressBook();
	const entry = getCachedEntry({label: selectedEntry?.label});
	const addressEntry = getCachedEntry({address: addressLike.address});
	const status: {type: TWarningType; message: string | ReactElement} | null = useMemo(() => {
		if (entry !== undefined && selectedEntry?.id !== entry.id && !entry.isHidden) {
			set_isFormValid(false);
			return {
				message: 'This name is already used in your address book',
				type: 'error'
			};
		}

		if (addressEntry !== undefined && addressEntry.id !== selectedEntry?.id && !addressEntry.isHidden) {
			set_isFormValid(false);
			return {
				message: 'This address is already in your address book',
				type: 'error'
			};
		}
		set_isFormValid(true);
		return null;
	}, [addressEntry, entry, selectedEntry?.id, set_isFormValid]);

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
