import React from 'react';
import {DisperseAppInfo} from 'packages/smol/components/Disperse/AppInfo';
import Disperse from 'packages/smol/components/Disperse/index';
import {DisperseContextApp} from 'packages/smol/components/Disperse/useDisperse';
import {DisperseQueryManagement} from 'packages/smol/components/Disperse/useDisperseQuery';
import {isZeroAddress} from '@builtbymom/web3/utils';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import type {ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';

function DispersePage(): ReactElement {
	return (
		<DisperseContextApp>
			{({configuration}) => (
				<DisperseQueryManagement>
					<BalancesCurtainContextApp
						selectedTokens={
							!isZeroAddress(configuration.tokenToSend?.address)
								? [configuration.tokenToSend as TToken]
								: []
						}>
						<Disperse />
					</BalancesCurtainContextApp>
				</DisperseQueryManagement>
			)}
		</DisperseContextApp>
	);
}

DispersePage.AppName = 'Disperse';
DispersePage.AppDescription = 'Transfer funds to multiple receivers';
DispersePage.AppInfo = <DisperseAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/disperse
 *************************************************************************************************/
DispersePage.MetadataTitle = 'Smol Disperse - Built by MOM';
DispersePage.MetadataDescription = 'Transfer funds to multiple receivers';
DispersePage.MetadataURI = 'https://smold.app/apps/disperse';
DispersePage.MetadataOG = 'https://smold.app/og.png';
DispersePage.MetadataTitleColor = '#000000';
DispersePage.MetadataThemeColor = '#FFD915';

export default DispersePage;
