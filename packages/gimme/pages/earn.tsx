import {Fragment, type ReactElement} from 'react';
import {BalancesCurtainContextApp} from 'packages/lib/contexts/useBalancesCurtain';
import {Earn} from '@gimmmeSections/Earn';
import {EarnContextApp} from '@gimmmeSections/Earn/useEarnFlow';

function EarnPage(): ReactElement {
	return (
		<EarnContextApp>
			<BalancesCurtainContextApp>
				<Earn />
			</BalancesCurtainContextApp>
		</EarnContextApp>
	);
}

EarnPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default EarnPage;
