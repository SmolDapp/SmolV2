import {isAddress} from '@builtbymom/web3/utils';

import type {TEarnConfiguration} from '@gimmmeSections/Earn/useEarnFlow';

export const useIsZapNeeded = (
	configuration: TEarnConfiguration
): {
	isZapNeededForDeposit: boolean;
	isZapNeededForWithdraw: boolean;
} => {
	// Zap is needed if we are depositing and ...
	const isZapNeededForDeposit =
		// We indeed have a tokenToSpend ...
		isAddress(configuration?.asset.token?.address) &&
		// ... and the opportunity token is also defined ...
		isAddress(configuration.opportunity?.token.address) &&
		// ... and we are trying to deposit a token that is different from the opportunity token
		configuration?.asset?.token?.address !== configuration?.opportunity.token?.address;

	const isZapNeededForWithdraw =
		// We indeed have a tokenToReceive ...
		isAddress(configuration?.asset.token?.address) &&
		// ... and the opportunity token is also defined ...
		isAddress(configuration.opportunity?.token.address) &&
		// ... and we are trying to withdraw a token that is different from the opportunity token
		configuration?.asset?.token?.address !== configuration?.opportunity.token?.address;

	return {isZapNeededForDeposit, isZapNeededForWithdraw};
};
