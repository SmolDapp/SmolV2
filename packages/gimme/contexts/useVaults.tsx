import {createContext, memo, useContext} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {useFetchYearnVaults} from '@yearn-finance/web-lib/hooks/useFetchYearnVaults';

import type {ReactElement} from 'react';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TVaultsContext = {
	vaults: TYDaemonVault[];
};

const VaultsContext = createContext<TVaultsContext>({
	vaults: []
});

export const VaultsContextApp = memo(function VaultsContextApp({children}: {children: ReactElement}): ReactElement {
	const {chainID} = useChainID();

	const {vaults: rawVaults} = useFetchYearnVaults([chainID]);

	return (
		<VaultsContext.Provider
			value={{
				vaults: Object.values(rawVaults)
			}}>
			{children}
		</VaultsContext.Provider>
	);
});

export const useVaults = (): TVaultsContext => useContext(VaultsContext);
