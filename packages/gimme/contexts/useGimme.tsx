import {createContext, memo, useContext} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {useFetchYearnVaults} from '@yearn-finance/web-lib/hooks/useFetchYearnVaults';

import type {ReactElement} from 'react';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TGimmeContext = {
	vaults: TYDaemonVault[];
};

const GimmeContext = createContext<TGimmeContext>({
	vaults: []
});

export const GimmeContextApp = memo(function GimmeContextApp({children}: {children: ReactElement}): ReactElement {
	const {chainID} = useChainID();

	const {vaults: rawVaults} = useFetchYearnVaults([chainID]);

	return (
		<GimmeContext.Provider
			value={{
				vaults: Object.values(rawVaults)
			}}>
			{children}
		</GimmeContext.Provider>
	);
});

export const useGimme = (): TGimmeContext => useContext(GimmeContext);
