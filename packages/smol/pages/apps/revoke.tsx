import {Fragment, type ReactElement} from 'react';
import {BalancesCurtainContextApp} from '@smolContexts/useBalancesCurtain';
import {Revoke} from '@smolSections/Revoke';
import {AllowancesContextApp} from '@smolSections/Revoke/useAllowances';

export default function RevokePage(): ReactElement {
	return (
		<AllowancesContextApp>
			<BalancesCurtainContextApp selectedTokens={[]}>
				<Revoke />
			</BalancesCurtainContextApp>
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
	return <Fragment>{page}</Fragment>;
};
