import {BalancesCurtainContextApp} from '@smolContexts/useBalancesCurtain';
import {SwapContextApp} from 'packages/smol/app/(apps)/swap/contexts/useSwapFlow.lifi';
import {SwapQueryManagement} from 'packages/smol/app/(apps)/swap/contexts/useSwapQuery';
import {Swap} from 'packages/smol/app/(apps)/swap/swap';

import type {ReactElement} from 'react';

export default function SwapPage(): ReactElement {
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
