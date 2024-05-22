import {createContext, memo, useContext, useMemo} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {toAddress} from '@builtbymom/web3/utils';
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
	const {vaults: rawVaults, isLoading: isLoadingVaults} = useFetchYearnVaults();
	const {balances, isLoading: isLoadingBalance, getBalance} = useWallet();

	const userVaults = useMemo(() => {
		const result: TDict<TYDaemonVault> = {};
		for (const [networkID, eachNetwork] of Object.entries(balances)) {
			for (const eachToken of Object.values(eachNetwork)) {
				const vault = rawVaults[toAddress(eachToken.address)];
				if (!vault) {
					continue;
				}

				let totalBalance = 0n;
				const balance = getBalance({address: eachToken.address, chainID: Number(networkID)});
				totalBalance += balance.raw;

				if (vault.staking.available) {
					const stakingBalance = getBalance({address: vault.staking.address, chainID: Number(networkID)});
					totalBalance += stakingBalance.raw;
				}

				if (totalBalance > 0n) {
					result[vault.address] = vault;
				}
			}
		}
		return result;
	}, [balances, getBalance, rawVaults]);

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
