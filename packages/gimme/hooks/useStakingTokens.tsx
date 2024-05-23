import {useCallback} from 'react';
import {useBalances} from '@builtbymom/web3/hooks/useBalances.multichains';
import {isAddress} from '@builtbymom/web3/utils';

import type {TAddress, TDict, TNormalizedBN} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function useStakingTokens(vaults: TDict<TYDaemonVault>): {
	stakingTokens: {address: TAddress; chainID: number}[];
	getStakingTokenBalance: (value: {address: TAddress; chainID: number}) => TNormalizedBN;
	isLoading: boolean;
} {
	const vaultsWithStaking = Object.values(vaults).filter(vault => {
		if (vault.staking.available && isAddress(vault.staking.address)) {
			return true;
		}
		return false;
	});

	const stakingTokens = vaultsWithStaking.map(vault => ({address: vault.staking.address, chainID: vault.chainID}));
	const {data: balances, isLoading} = useBalances({tokens: stakingTokens});

	const getStakingTokenBalance = useCallback(
		({address, chainID}: {address: TAddress; chainID: number}): TNormalizedBN => {
			return balances[chainID][address].balance;
		},
		[balances]
	);
	return {stakingTokens, getStakingTokenBalance, isLoading};
}
