import {useCallback, useEffect} from 'react';
import {useIndexedDBStore} from 'use-indexeddb';

import type {TAddressBookEntry} from 'packages/smol/app/(apps)/address-book/types';
import type {ReactElement} from 'react';

type TMessageEvent = {
	type: 'GET_DB_DATA';
	key: string;
};

const ALLOWED_ORIGIN = [
	'http://localhost:3000',
	'https://app.safe.global',
	'https://playground.smold.app',
	'https://mylittlestable.mom'
];

function PixelPage(): ReactElement {
	const {getAll} = useIndexedDBStore<TAddressBookEntry>('address-book');

	const handleMessage = useCallback(
		async (event: MessageEvent) => {
			const messageData = event.data as TMessageEvent;

			if (messageData.type === 'GET_DB_DATA') {
				if (!ALLOWED_ORIGIN.includes(event.origin)) {
					console.warn('Rejected message from unauthorized origin:', event.origin);
					return;
				}

				try {
					const data = await getAll();
					console.warn('Sending data to parent:', data);
					window.parent.postMessage({type: 'DB_RESPONSE', data}, event.origin);
				} catch (error) {
					console.error('Error getting data from IndexedDB:', error);
				}
			}
		},
		[getAll]
	);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('message', handleMessage);
			return () => window.removeEventListener('message', handleMessage);
		}
		return;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [handleMessage, typeof window]);

	return <span className={'hidden'} />;
}

export default function Wrapper(): ReactElement {
	return <PixelPage />;
}
