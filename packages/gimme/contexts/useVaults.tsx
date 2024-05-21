import {createContext, memo, useContext, useMemo} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {useFetchYearnVaults} from '@yearn-finance/web-lib/hooks/useFetchYearnVaults';

import type {ReactElement} from 'react';
import type {TDict} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TVaultsContext = {
	vaults: TYDaemonVault[];
	userVaultsArray: TYDaemonVault[];

	userVaults: TDict<TYDaemonVault>;
	isLoadingVaults: boolean;
	isLoadingUserVaults: boolean;
};

const VaultsContext = createContext<TVaultsContext>({
	vaults: [],
	userVaultsArray: [],
	userVaults: {},
	isLoadingVaults: false,
	isLoadingUserVaults: false
});

export const VaultsContextApp = memo(function VaultsContextApp({children}: {children: ReactElement}): ReactElement {
	const {chainID} = useChainID();
	const {vaults: rawVaults, isLoading: isLoadingVaults} = useFetchYearnVaults([chainID]);
	const {listTokensWithBalance, isLoading: isLoadingBalance} = useTokensWithBalance();

	// const {getBalance} = useWallet();

	const userVaults = useMemo(() => {
		const result: TDict<TYDaemonVault> = {};
		const tokensWithBalance = listTokensWithBalance(chainID);

		tokensWithBalance.forEach(token => {
			const vault = rawVaults[token.address];
			if (vault) {
				result[vault.address] = vault;
			}
		});

		// for (const vaultAddress in rawVaults) {
		// 	const hasBalance =
		// 		getBalance({address: rawVaults[vaultAddress].address, chainID: rawVaults[vaultAddress].chainID}).raw >
		// 		0n;
		// 	const hasStakingBalance =
		// 		getBalance({address: rawVaults[vaultAddress].staking.address, chainID: rawVaults[vaultAddress].chainID})
		// 			.raw > 0n;
		// 	if (hasBalance || hasStakingBalance) {
		// 		result[vaultAddress] = rawVaults[vaultAddress];
		// 	}
		// }
		return result;
	}, [chainID, listTokensWithBalance, rawVaults]);

	return (
		<VaultsContext.Provider
			value={{
				vaults: Object.values(rawVaults),
				userVaults,
				userVaultsArray: Object.values(userVaults),
				isLoadingVaults,
				isLoadingUserVaults: isLoadingVaults || isLoadingBalance
			}}>
			{children}
		</VaultsContext.Provider>
	);
});

export const useVaults = (): TVaultsContext => useContext(VaultsContext);
