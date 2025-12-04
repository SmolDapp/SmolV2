import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';
import {DisperseContextApp} from 'app/(apps)/disperse/contexts/useDisperse';
import Disperse from 'app/(apps)/disperse/disperse';

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
