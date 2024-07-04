import {useVaults} from 'packages/gimme/contexts/useVaults';

import type {TAddress} from '@builtbymom/web3/types';

export const useGetIsStablecoin = (): {
	getIsStablecoin: (value: {address: TAddress | undefined; chainID: number | undefined}) => boolean;
} => {
	const {vaults} = useVaults();

	const getIsStablecoin = ({
		address,
		chainID
	}: {
		address: TAddress | undefined;
		chainID: number | undefined;
	}): boolean => {
		if (!address || !chainID) {
			return false;
		}

		const relatedVaults = Object.values(vaults).filter(
			vault => vault.token.address === address && vault.chainID === chainID
		);

		if (relatedVaults.some(vault => vault.category === 'Stablecoin')) {
			return true;
		}

		return false;
	};
	return {getIsStablecoin};
};
