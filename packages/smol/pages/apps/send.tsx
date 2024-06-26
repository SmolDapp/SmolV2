import {Send} from 'packages/smol/components/Send';
import {SendContextApp} from 'packages/smol/components/Send/useSend';
import {SendQueryManagement} from 'packages/smol/components/Send/useSendQuery';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import type {ReactElement} from 'react';

export default function SendPage(): ReactElement {
	return (
		<SendContextApp>
			{({configuration: {inputs}}) => (
				<SendQueryManagement>
					<BalancesCurtainContextApp selectedTokens={inputs.map(input => input.token).filter(Boolean)}>
						<Send />
					</BalancesCurtainContextApp>
				</SendQueryManagement>
			)}
		</SendContextApp>
	);
}

SendPage.AppName = 'Send';
SendPage.AppDescription = 'Deliver any of your tokens anywhere';
SendPage.AppInfo = (
	<>
		<p>
			{'The send app lets you (yep, you guessed it) send your tokens through cyberspace to their destination. '}
		</p>
		<br />
		<p>
			{'Select one token or several, input the receiver address (or if you’re a chad, use the address book) and '}
			{'you’re good to go.'}
		</p>
		<br />
		<p>
			{'Make sure the chain selector in the sidebar is set to the chain you want to send the tokens on. Simple '}
			{'innit.'}
		</p>
	</>
);
