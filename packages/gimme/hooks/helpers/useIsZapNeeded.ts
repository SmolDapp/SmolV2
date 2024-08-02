import {isAddress} from '@builtbymom/web3/utils';

import type {TAddress} from '@builtbymom/web3/types';

export const useIsZapNeeded = (
	inputTokenAddress: TAddress | undefined,
	outputTokenAddress: TAddress | undefined
): {
	isZapNeeded: boolean;
} => {
	// Zap is needed if we are depositing and ...
	const isZapNeeded =
		// We indeed have a tokenToSpend ...
		isAddress(inputTokenAddress) &&
		// ... and the output token is also defined ...
		isAddress(outputTokenAddress) &&
		// ... and we are trying to deposit a token that is different from the output token
		inputTokenAddress !== outputTokenAddress;

	return {isZapNeeded};
};
