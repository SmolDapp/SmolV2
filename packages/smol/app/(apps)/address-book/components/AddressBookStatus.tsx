import {useMemo} from 'react';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {Warning} from 'packages/smol/common/Warning';

import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TWarningType} from 'packages/smol/common/Warning';
import type {ReactElement} from 'react';

export const AddressBookStatus = (props: {
	setIsFormValid: (value: boolean) => void;
	addressLike: TInputAddressLike;
}): ReactElement | null => {
	const {setIsFormValid, addressLike} = props;
	const {getCachedEntry, selectedEntry} = useAddressBook();
	const entry = getCachedEntry({label: selectedEntry?.label});
	const addressEntry = getCachedEntry({address: addressLike.address});
	const status: {type: TWarningType; message: string | ReactElement} | null = useMemo(() => {
		if (entry !== undefined && selectedEntry?.id !== entry.id && !entry.isHidden) {
			setIsFormValid(false);
			return {
				message: 'This name is already used in your address book',
				type: 'error'
			};
		}

		if (addressEntry !== undefined && addressEntry.id !== selectedEntry?.id && !addressEntry.isHidden) {
			setIsFormValid(false);
			return {
				message: 'This address is already in your address book',
				type: 'error'
			};
		}
		setIsFormValid(true);
		return null;
	}, [addressEntry, entry, selectedEntry?.id, setIsFormValid]);

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
