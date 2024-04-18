import {Revoke} from 'components/sections/Revoke';
import {AllowancesContextApp} from 'components/sections/Revoke/useAllowances';
import {BalancesCurtainContextApp} from 'contexts/useBalancesCurtain';

import type {ReactElement} from 'react';

export default function RevokePage(): ReactElement {
	return (
		<AllowancesContextApp>
			{({configuration}) => (
				<BalancesCurtainContextApp
					selectedTokenAddresses={
						configuration.tokenToCheck?.address ? [configuration.tokenToCheck?.address] : []
					}>
					<Revoke />
				</BalancesCurtainContextApp>
			)}
		</AllowancesContextApp>
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
	return <>{page}</>;
};
