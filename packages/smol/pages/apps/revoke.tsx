import {type ReactElement} from 'react';
import {isZeroAddress} from '@builtbymom/web3/utils';
import {Revoke} from '@smolSections/Revoke';
import {RevokeContextApp} from '@smolSections/Revoke/useAllowances';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import type {TToken} from '@builtbymom/web3/types';

export default function RevokePage(): ReactElement {
	return (
		<RevokeContextApp>
			{({configuration}) => (
				<BalancesCurtainContextApp
					selectedTokens={
						!isZeroAddress(configuration.tokenToCheck?.address)
							? [configuration.tokenToCheck as TToken]
							: []
					}>
					<Revoke />
				</BalancesCurtainContextApp>
			)}
		</RevokeContextApp>
	);
}

RevokePage.AppName = 'Revoke';
RevokePage.AppDescription = 'Take control of your contract approvals with Revoke.';
RevokePage.AppInfo = (
	<>
		<p>
			{
				"Revoke lets you see which contracts your wallet has given approvals to, and lets you 'revoke' access to any contracts at will."
			}
		</p>
		<br />
		<p>{'"Why would I use revoke?"'}</p>
		<br />
		<p>{'Maybe you granted access to a dodgy contract and want peace of mind?'}</p>
		<br />
		<p>{'Or perhaps you granted a contract permission to spend 10,000 of your tokens instead of 10. '}</p>
		<br />
		<p>
			{
				'Revoke gives you full transparency to see which contracts have the power to spend from your wallet, and the power to take back control with a simple click (but please note revoking a contract requires a transaction to be signed by your wallet).'
			}
		</p>
	</>
);
