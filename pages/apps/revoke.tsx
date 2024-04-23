import {Fragment, type ReactElement} from 'react';
import {Revoke} from 'components/sections/Revoke';
import {BalancesCurtainContextApp} from 'contexts/useBalancesCurtain';

export default function RevokePage(): ReactElement {
	return (
		<>
			<BalancesCurtainContextApp selectedTokenAddresses={[]}>
				<Revoke />
			</BalancesCurtainContextApp>
		</>
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
