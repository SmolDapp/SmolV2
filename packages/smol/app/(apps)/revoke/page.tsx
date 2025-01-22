import {isZeroAddress} from 'lib/utils/tools.addresses';

import {BalancesCurtainContextApp} from '@smolContexts/useBalancesCurtain';
import {RevokeContextApp} from 'packages/smol/app/(apps)/revoke/contexts/useAllowances';
import {Revoke} from 'packages/smol/app/(apps)/revoke/revoke';

import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

export default function RevokePage(): ReactElement {
	return (
		<RevokeContextApp>
			{({configuration}) => (
				<BalancesCurtainContextApp
					selectedTokens={
						!isZeroAddress(configuration.tokenToCheck?.address)
							? [configuration.tokenToCheck as TERC20TokensWithBalance]
							: []
					}>
					<Revoke />
				</BalancesCurtainContextApp>
			)}
		</RevokeContextApp>
	);
}
