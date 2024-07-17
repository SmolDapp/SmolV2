import {isAddress} from '@builtbymom/web3/utils';

import type {TEarnConfiguration} from '@gimmmeSections/Earn/useEarnFlow';

export const useIsBridgeNeeded = (
	configuration: TEarnConfiguration
): {
	isBridgeNeededForDeposit: boolean;
	isBridgeNeededForWithdraw: boolean;
} => {
	// Zap is needed if we are depositing and ...
	const isBridgeNeededForDeposit =
		// We indeed have a tokenToSpend ...
		isAddress(configuration?.asset.token?.address) &&
		// ... and the opportunity token is also defined ...
		isAddress(configuration.opportunity?.token.address) &&
		// ... and we are trying to deposit a token that is different from the opportunity token
		configuration?.asset?.token?.address !== configuration?.opportunity.token?.address &&
		// ... and chain ids are different
		configuration.asset.token.chainID !== configuration.opportunity.chainID;

	const isBridgeNeededForWithdraw =
		// We indeed have a tokenToReceive ...
		isAddress(configuration?.asset.token?.address) &&
		// ... and the opportunity token is also defined ...
		isAddress(configuration.opportunity?.token.address) &&
		// ... and we are trying to withdraw a token that is different from the opportunity token
		configuration?.asset?.token?.address !== configuration?.opportunity.token?.address &&
		// ... and chain ids are different
		configuration.asset.token.chainID !== configuration.opportunity.chainID;

	return {isBridgeNeededForDeposit, isBridgeNeededForWithdraw};
};
