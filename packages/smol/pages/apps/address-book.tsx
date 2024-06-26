import {type ReactElement} from 'react';
import {AddressBook} from 'packages/smol/components/AddressBook';
import {AddressBookAppInfo} from 'packages/smol/components/AddressBook/AppInfo';

function AddressBookPage(): ReactElement {
	return <AddressBook />;
}

AddressBookPage.AppName = 'Address Book';
AddressBookPage.AppDescription = 'Keep your friends close and your enemies closer';
AddressBookPage.AppInfo = <AddressBookAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/address-book
 *************************************************************************************************/
AddressBookPage.MetadataTitle = 'Smol Address Book - Built by MOM';
AddressBookPage.MetadataDescription = 'Keep your friends close and your enemies closer';
AddressBookPage.MetadataURI = 'https://smold.app/apps/address-book';
AddressBookPage.MetadataOG = 'https://smold.app/og.png';
AddressBookPage.MetadataTitleColor = '#000000';
AddressBookPage.MetadataThemeColor = '#FFD915';

export default AddressBookPage;
