import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import {RevokeContextApp} from 'packages/smol/app/(apps)/revoke/contexts/useAllowances';
import {Revoke} from 'packages/smol/app/(apps)/revoke/revoke';

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
