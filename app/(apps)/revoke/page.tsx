import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';
import {RevokeContextApp} from 'app/(apps)/revoke/contexts/useAllowances';
import {Revoke} from 'app/(apps)/revoke/revoke';

import type {ReactElement} from 'react';

export default function RevokePage(): ReactElement {
	return (
		<RevokeContextApp>
			<BalancesCurtainContextApp>
				<Revoke />
			</BalancesCurtainContextApp>
		</RevokeContextApp>
	);
}
