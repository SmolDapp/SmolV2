import {type ReactElement} from 'react';
import {BalancesCurtainContextApp} from 'packages/lib/contexts/useBalancesCurtain';
import {isZeroAddress} from '@builtbymom/web3/utils';
import {Earn} from '@gimmmeSections/Earn';
import {EarnContextApp} from '@gimmmeSections/Earn/useEarnFlow';

import {SolverContextApp} from '../contexts/useSolver';

import type {TToken} from '@builtbymom/web3/types';

function EarnPage(): ReactElement {
	return (
		<EarnContextApp>
			{({configuration}) => (
				<SolverContextApp>
					<BalancesCurtainContextApp
						appearAs={'modal'}
						selectedTokens={
							!isZeroAddress(configuration.asset.token?.address)
								? [configuration.asset.token as TToken]
								: []
						}>
						<Earn />
					</BalancesCurtainContextApp>
				</SolverContextApp>
			)}
		</EarnContextApp>
	);
}

export default EarnPage;
