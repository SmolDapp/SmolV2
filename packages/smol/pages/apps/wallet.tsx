import {Wallet} from 'packages/smol/components/Wallet';

import type {ReactElement} from 'react';

export default function WalletPage(): ReactElement {
	return <Wallet />;
}

WalletPage.AppName = 'Wallet';
WalletPage.AppDescription = 'Check your wallet on any chain (it’s in the sidebar bruv)';
WalletPage.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);
WalletPage.MetadataTitle = 'Wallet';
WalletPage.MetadataDescription = 'Wallet';
WalletPage.MetadataURI = 'https://smold.app/apps/wallet';
WalletPage.MetadataOG = 'https://smold.app/og.png';
WalletPage.MetadataTitleColor = '#000000';
WalletPage.MetadataThemeColor = '#FFD915';
