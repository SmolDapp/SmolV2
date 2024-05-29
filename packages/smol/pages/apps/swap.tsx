import {Swap} from '@smolSections/Swap';
import {SwapAppInfo} from '@smolSections/Swap/AppInfo';
import {SwapContextApp} from '@smolSections/Swap/useSwapFlow.lifi';
import {SwapQueryManagement} from '@smolSections/Swap/useSwapQuery';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import type {ReactElement} from 'react';

function SwapPage(): ReactElement {
	return (
		<SwapContextApp>
			{({configuration: {input, output}}) => (
				<SwapQueryManagement>
					<BalancesCurtainContextApp selectedTokens={[input, output].map(elem => elem.token).filter(Boolean)}>
						<Swap />
					</BalancesCurtainContextApp>
				</SwapQueryManagement>
			)}
		</SwapContextApp>
	);
}

SwapPage.AppName = 'Swap';
SwapPage.AppDescription =
	'Swap tokens on the same chain, or across different chains. It’s the future, but like… right now.';
SwapPage.AppInfo = <SwapAppInfo />;

export default SwapPage;
