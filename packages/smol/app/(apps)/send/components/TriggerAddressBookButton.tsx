import {isZeroAddress} from 'lib/utils/tools.addresses';
import {useMemo} from 'react';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {useSendContext} from 'packages/smol/app/(apps)/send/contexts/useSendContext';

import type {ReactElement, ReactNode} from 'react';

export function TriggerAddressBookButton({children}: {children: ReactNode}): ReactElement {
	const {setCurtainStatus, dispatchConfiguration} = useAddressBook();
	const {configuration} = useSendContext();

	const validLabel = useMemo(() => {
		if (configuration.receiver.label.endsWith('.eth')) {
			return configuration.receiver.label.split('.').slice(0, -1).join(' ');
		}
		return configuration.receiver.label;
	}, [configuration.receiver.label]);

	return (
		<button
			className={'font-bold transition-all'}
			onClick={() => {
				const hasALabel = isZeroAddress(configuration.receiver.label);
				dispatchConfiguration({
					type: 'SET_SELECTED_ENTRY',
					payload: {
						address: configuration.receiver.address,
						label: hasALabel ? validLabel : '',
						slugifiedLabel: '',
						chains: [],
						isFavorite: false
					}
				});
				setCurtainStatus({isOpen: true, isEditing: true});
			}}>
			{children}
		</button>
	);
}
