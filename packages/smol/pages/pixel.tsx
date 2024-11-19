import {Fragment, type ReactElement, useCallback, useEffect, useState} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';
import {useEventListener} from '@react-hookz/web';

import type {TAddressBookEntry} from '@lib/types/AddressBook';

type TMessageEvent = {
	type: 'GET_DB_DATA';
	key: string;
};

const ALLOWED_ORIGIN = 'http://localhost:3000';

function PixelPage(): ReactElement {
	const {getAll} = useIndexedDBStore<TAddressBookEntry>('address-book');

	const handleMessage = useCallback(
		async (event: MessageEvent) => {
			// Security: Verify origin
			const messageData = event.data as TMessageEvent;

			if (messageData.type === 'GET_DB_DATA') {
				if (event.origin !== ALLOWED_ORIGIN) {
					console.warn('Rejected message from unauthorized origin:', event.origin);
					return;
				}

				const data = await getAll();
				window.parent.postMessage({type: 'DB_RESPONSE', data}, event.origin);
			}
		},
		[getAll]
	);

	useEventListener(window, 'message', handleMessage);

	return <span className={'hidden'} />;
}

export default function Wrapper(): ReactElement {
	const [isMounted, set_isMounted] = useState(false);

	useEffect(() => {
		set_isMounted(true);
	}, []);

	return isMounted ? <PixelPage /> : <Fragment />;
}
