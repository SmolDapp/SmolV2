import {createContext, memo, useContext, useMemo} from 'react';
import {isAddressEqual} from 'viem';
import useSWR from 'swr';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {baseFetcher, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';

import {useStakingTokens} from '../hooks/useStakingTokens';

import type {ReactElement} from 'react';
import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TVaultsContext = {
	vaults: TDict<TYDaemonVault>;
	vaultsArray: TYDaemonVault[];
	userVaultsArray: TYDaemonVault[];
	userVaults: TDict<TYDaemonVault>;
	getStakingTokenBalance: (value: {address: TAddress; chainID: number}) => TNormalizedBN;
	isLoadingVaults: boolean;
	isLoadingUserVaults: boolean;
};

const VaultsContext = createContext<TVaultsContext>({
	vaults: {},
	vaultsArray: [],
	userVaultsArray: [],
	userVaults: {},
	getStakingTokenBalance: (): TNormalizedBN => zeroNormalizedBN,
	isLoadingVaults: false,
	isLoadingUserVaults: false
});

export const VaultsContextApp = memo(function VaultsContextApp({children}: {children: ReactElement}): ReactElement {
	const {data: gimmeVaults, isLoading: isLoadingVaults} = useSWR<TYDaemonVault[]>(
		'https://ydaemon.yearn.fi/vaults/gimme?chainIDs=137', // Persist on displaying polygon vaults
		baseFetcher
	);

	const gimmeVaultsDict: TDict<TYDaemonVault> = useMemo(
		() =>
			gimmeVaults?.reduce(
				(acc, current) => ({
					...acc,
					[current.address]:
						isAddressEqual(current.address, '0x28F53bA70E5c8ce8D03b1FaD41E9dF11Bb646c36') &&
						current.chainID === 137
							? {
									...current,
									name: 'MATIC',
									router: toAddress('0x1112dbCF805682e828606f74AB717abf4b4FD8DE')
								}
							: current
				}),
				{}
			) || {},
		[gimmeVaults]
	);

	const {balances, isLoading: isLoadingBalance, getBalance} = useWallet();
	const {getStakingTokenBalance} = useStakingTokens(gimmeVaultsDict);

	const userVaults = useMemo(() => {
		const result: TDict<TYDaemonVault> = {};
		for (const [networkID, eachNetwork] of Object.entries(balances)) {
			for (const eachToken of Object.values(eachNetwork)) {
				const vault = gimmeVaultsDict[toAddress(eachToken.address)];
				if (!vault) {
					continue;
				}

				let totalBalance = 0n;
				const balance = getBalance({address: eachToken.address, chainID: Number(networkID)});
				totalBalance += balance.raw;

				if (vault.staking.available) {
					const stakingBalance = getStakingTokenBalance({
						address: vault.staking.address,
						chainID: Number(networkID)
					});
					totalBalance += stakingBalance.raw;
				}

				if (totalBalance > 0n) {
					result[vault.address] = vault;
				}
			}
		}
		return result;
	}, [balances, getBalance, getStakingTokenBalance, gimmeVaultsDict]);

	return (
		<VaultsContext.Provider
			value={{
				vaults: gimmeVaultsDict,
				vaultsArray: Object.values(gimmeVaultsDict || {}) || [], //.toSorted((a, b) => b.apr.netAPR - a.apr.netAPR) || [],
				userVaults,
				userVaultsArray: Object.values(userVaults),
				getStakingTokenBalance,
				isLoadingVaults,
				isLoadingUserVaults: isLoadingVaults || isLoadingBalance
			}}>
			{children}
		</VaultsContext.Provider>
	);
});
export const useVaults = (): TVaultsContext => useContext(VaultsContext);
