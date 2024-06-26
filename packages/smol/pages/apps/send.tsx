import {Send} from 'packages/smol/components/Send';
import {SendAppInfo} from 'packages/smol/components/Send/AppInfo';
import {SendContextApp} from 'packages/smol/components/Send/useSendContext';
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
SendPage.AppInfo = <SendAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/send
 *************************************************************************************************/
SendPage.MetadataTitle = 'Smol Send - Built by MOM';
SendPage.MetadataDescription = 'Deliver any of your tokens anywhere';
SendPage.MetadataURI = 'https://smold.app/apps/send';
SendPage.MetadataOG = 'https://smold.app/og.png';
SendPage.MetadataTitleColor = '#000000';
SendPage.MetadataThemeColor = '#FFD915';
