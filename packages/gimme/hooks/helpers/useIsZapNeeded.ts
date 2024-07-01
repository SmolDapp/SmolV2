import {isAddress} from '@builtbymom/web3/utils';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

/**
 * Temp solution, will be gone when lifi added
 */
export const useIsZapNeeded = (): boolean => {
	const {configuration} = useEarnFlow();
	return (
		isAddress(configuration.asset.token?.address) &&
		isAddress(configuration.opportunity?.token.address) &&
		configuration.asset.token?.address !== configuration.opportunity?.token.address
	);
};
