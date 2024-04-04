import {Fragment, type ReactElement} from 'react';
import {AddressBook} from 'components/sections/AddressBook';

function AddressBookPage(): ReactElement {
	return <AddressBook />;
}

AddressBookPage.AppName = 'Address Book';
AddressBookPage.AppDescription = 'Keep your friends close and your enemies closer';
AddressBookPage.AppInfo = (
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
		<p>{'Thanks anon, now go forth and and send thy digital tokens.'}</p>
	</>
);
AddressBookPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default AddressBookPage;
