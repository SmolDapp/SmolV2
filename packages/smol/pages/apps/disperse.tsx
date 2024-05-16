import React from 'react';
import {isZeroAddress} from '@builtbymom/web3/utils';
import Disperse from '@smolSections/Disperse/index';
import {DisperseContextApp} from '@smolSections/Disperse/useDisperse';
import {DisperseQueryManagement} from '@smolSections/Disperse/useDisperseQuery';
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
DispersePage.AppInfo = (
	<>
		<p>{'The OG disperse app with a fancy UI facelift.'}</p>
		<br />
		<p>
			{
				'Whether you’re sharing project funds between contributors, or just sending tokens to more than one address. '
			}
			{'Disperse lets you do it all in one transaction.'}
		</p>
		<br />
		<p>
			{
				'With the time you saved you could start writing a novel or open a vegan bakery? If it’s the latter, send '
			}
			{'cakes blz.'}
		</p>
		<br />
	</>
);

export default DispersePage;
