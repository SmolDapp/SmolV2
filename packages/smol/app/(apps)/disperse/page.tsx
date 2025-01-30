import React from 'react';

import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';
import {DisperseContextApp} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse';
import Disperse from 'packages/smol/app/(apps)/disperse/disperse';

import type {ReactElement} from 'react';

export default function DispersePage(): ReactElement {
	return (
		<DisperseContextApp>
			<BalancesCurtainContextApp>
				<Disperse />
			</BalancesCurtainContextApp>
		</DisperseContextApp>
	);
}
