import {Fragment, type ReactElement} from 'react';
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
RevokePage.AppDescription = 'Revoke allowances from any token';
RevokePage.AppInfo = (
	<>
		<p>{'Revoke your allowances'}</p>
	</>
);

RevokePage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};
