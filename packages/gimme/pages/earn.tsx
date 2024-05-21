import {Fragment, type ReactElement} from 'react';
import {BalancesCurtainContextApp} from 'packages/lib/contexts/useBalancesCurtain';
import {isZeroAddress} from '@builtbymom/web3/utils';
import {Earn} from '@gimmmeSections/Earn';
import {EarnContextApp} from '@gimmmeSections/Earn/useEarnFlow';

import type {TToken} from '@builtbymom/web3/types';

function EarnPage(): ReactElement {
	return (
		<EarnContextApp>
			{({configuration}) => (
				<BalancesCurtainContextApp
					appearAs={'modal'}
					selectedTokens={
						!isZeroAddress(configuration.asset.token?.address) ? [configuration.asset.token as TToken] : []
					}>
					<Earn />
				</BalancesCurtainContextApp>
			)}
		</EarnContextApp>
	);
}

EarnPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default EarnPage;
