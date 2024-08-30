import React from 'react';
import {Wallet} from 'packages/smol/components/Wallet';

import {WalletAppInfo} from '../components/Wallet/AppInfo';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	return <Wallet />;
}

Index.AppName = 'Wallet';
Index.AppDescription = 'If you want to see tokens from another chains - switch chain in the side bar.';
Index.AppInfo = <WalletAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /
 *************************************************************************************************/
Index.MetadataTitle = 'Smol - Built by MOM';
Index.MetadataDescription =
	'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.';
Index.MetadataURI = 'https://smold.app';
Index.MetadataOG = 'https://smold.app/og.png';
Index.MetadataTitleColor = '#000000';
Index.MetadataThemeColor = '#FFD915';
