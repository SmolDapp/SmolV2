import {Fragment} from 'react';
import {Wallet} from 'components/sections/Wallet';

import type {ReactElement} from 'react';

export default function WalletPage(): ReactElement {
	return <Wallet />;
}

WalletPage.AppName = 'Wallet';
WalletPage.AppDescription = 'If you want to see tokens form another chains - switch chain in the side bar.';
WalletPage.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);
WalletPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};
