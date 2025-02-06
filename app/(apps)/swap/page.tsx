import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';
import {SwapContextApp} from 'app/(apps)/swap/contexts/useSwapFlow.lifi';
import {Swap} from 'app/(apps)/swap/swap';

import type {ReactElement} from 'react';

export default function SwapPage(): ReactElement {
	return (
		<SwapContextApp>
			<BalancesCurtainContextApp>
				<Swap />
			</BalancesCurtainContextApp>
		</SwapContextApp>
	);
}
