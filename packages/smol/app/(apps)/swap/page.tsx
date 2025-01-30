import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {SwapContextApp} from 'packages/smol/app/(apps)/swap/contexts/useSwapFlow.lifi';
import {Swap} from 'packages/smol/app/(apps)/swap/swap';

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
