import React from 'react';
import {Wallet} from 'packages/smol/components/Wallet';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	return <Wallet />;
}

Index.AppName = 'Wallet';
Index.AppDescription = 'If you want to see tokens form another chains - switch chain in the side bar.';
Index.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);
