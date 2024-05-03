import {Fragment, type ReactElement} from 'react';
import {BalancesCurtainContextApp} from '@contexts/useBalancesCurtain';
import {Revoke} from '@sections/Revoke';
import {AllowancesContextApp} from '@sections/Revoke/useAllowances';

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
	return <Fragment>{page}</Fragment>;
};
