import {useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {supportedNetworks} from '@gimmeutils/constants';

import type {Chain} from 'viem';

export function useCurrentChain(): Chain {
	const {chainID} = useWeb3();
	const currentNetwork = useMemo(() => {
		const currentNetwork = supportedNetworks.find((network): boolean => network.id === chainID);
		if (!currentNetwork) {
			return supportedNetworks[0];
		}
		return currentNetwork;
	}, [chainID]);

	return currentNetwork;
}
