import {Wallet} from 'packages/smol/components/Wallet';
import {WalletAppInfo} from 'packages/smol/components/Wallet/AppInfo';

import type {ReactElement} from 'react';

export default function WalletPage(): ReactElement {
	return <Wallet />;
}

WalletPage.AppName = 'Wallet';
WalletPage.AppDescription = 'Check your wallet on any chain (it’s in the sidebar bruv)';
WalletPage.AppInfo = <WalletAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/wallet
 *************************************************************************************************/
WalletPage.MetadataTitle = 'Smol - Built by MOM';
WalletPage.MetadataDescription =
	'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.';
WalletPage.MetadataURI = 'https://smold.app';
WalletPage.MetadataOG = 'https://smold.app/og.png';
WalletPage.MetadataTitleColor = '#000000';
WalletPage.MetadataThemeColor = '#FFD915';
