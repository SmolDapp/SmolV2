import type {ReactElement} from 'react';

function AddressBookAppInfo(): ReactElement {
	return (
		<>
			<p>
				{
					'The Smol address book was designed to make your life easier, but more importantly, protect you from common '
				}
				{'address mimicking scams.'}{' '}
			</p>
			<br />
			<p>{'Addresses are saved locally on your browser so no one but you ever sees them! '}</p>
			<br />
			<p>{'“Wow, privacy and functionality, you Smol guys rock!” '}</p>
			<br />
			<p>{'Thanks anon, now go forth and send thy digital tokens.'}</p>
		</>
	);
}

export {AddressBookAppInfo};
