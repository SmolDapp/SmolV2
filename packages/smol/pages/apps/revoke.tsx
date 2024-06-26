import {type ReactElement} from 'react';
import {Revoke} from 'packages/smol/components/Revoke';
import {RevokeAppInfo} from 'packages/smol/components/Revoke/AppInfo';
import {RevokeContextApp} from 'packages/smol/components/Revoke/useAllowances';
import {isZeroAddress} from '@builtbymom/web3/utils';
import {BalancesCurtainContextApp} from '@lib/contexts/useBalancesCurtain';

import type {TToken} from '@builtbymom/web3/types';

export default function RevokePage(): ReactElement {
	return (
		<RevokeContextApp>
			{({configuration}) => (
				<BalancesCurtainContextApp
					selectedTokens={
						!isZeroAddress(configuration.tokenToCheck?.address)
							? [configuration.tokenToCheck as TToken]
							: []
					}>
					<Revoke />
				</BalancesCurtainContextApp>
			)}
		</RevokeContextApp>
	);
}

RevokePage.AppName = 'Revoke';
RevokePage.AppDescription = 'Take control of your contract approvals with Revoke.';
RevokePage.AppInfo = <RevokeAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/revoke
 *************************************************************************************************/
RevokePage.MetadataTitle = 'Smol Revoke - Built by MOM';
RevokePage.MetadataDescription = 'Take control of your contract approvals with Revoke.';
RevokePage.MetadataURI = 'https://smold.app/apps/revoke';
RevokePage.MetadataOG = 'https://smold.app/og.png';
RevokePage.MetadataTitleColor = '#000000';
RevokePage.MetadataThemeColor = '#FFD915';
