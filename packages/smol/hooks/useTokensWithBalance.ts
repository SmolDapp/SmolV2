import {useCallback, useMemo, useState} from 'react';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {ETH_TOKEN_ADDRESS, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareEffect} from '@react-hookz/web';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import type {TChainTokens, TDict, TNDict, TToken} from '@builtbymom/web3/types';

export function useTokensWithBalance(): {
	listAllTokensWithBalance: () => TToken[];
	listTokensWithBalance: (chainID?: number) => TToken[];
	listTokens: (chainID?: number) => TToken[];
	isLoading: boolean;
	isLoadingOnCurrentChain: boolean;
	isLoadingOnChain: (chainID?: number) => boolean;
	onRefresh: () => Promise<TChainTokens>;
} {
	const {chainID} = useWeb3();
	const {balances, getBalance, isLoading, isLoadingOnCurrentChain, isLoadingOnChain, onRefresh} = useWallet();
	const [allTokens, set_allTokens] = useState<TNDict<TDict<TToken>>>({});
	const {tokenLists, isCustomToken} = useTokenList();

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/**********************************************************************************************
	 ** This useEffect hook will be triggered when the currentNetworkTokenList or safeChainID
	 ** changes, indicating that we need to update the list of tokens with balance to match the
	 ** current network.
	 *********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: TNDict<TDict<TToken>> = {};
		for (const [networkID, eachNetwork] of Object.entries(tokenLists)) {
			if (!possibleDestinationsTokens[Number(networkID)]) {
				possibleDestinationsTokens[Number(networkID)] = {};
				const {nativeCurrency} = getNetwork(Number(networkID));
				if (nativeCurrency) {
					possibleDestinationsTokens[Number(networkID)][ETH_TOKEN_ADDRESS] = {
						address: ETH_TOKEN_ADDRESS,
						chainID: Number(networkID),
						name: nativeCurrency.name,
						symbol: nativeCurrency.symbol,
						decimals: nativeCurrency.decimals,
						value: 0,
						balance: zeroNormalizedBN,
						logoURI: `${process.env.SMOL_ASSETS_URL}/token/${Number(networkID)}/${ETH_TOKEN_ADDRESS}/logo-32.png`
					};
				}
			}

			for (const eachToken of Object.values(eachNetwork)) {
				if (eachToken.address === toAddress('0x0000000000000000000000000000000000001010')) {
					continue; //ignore matic erc20
				}
				possibleDestinationsTokens[Number(networkID)][toAddress(eachToken.address)] = eachToken;
			}
		}
		set_allTokens(possibleDestinationsTokens);
	}, [tokenLists]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with balance. It will be triggered
	 ** when the allTokens or getBalance or isCustomToken or currentIdentifier changes.
	 *********************************************************************************************/
	const listTokensWithBalance = useCallback(
		(_chainID?: number): TToken[] => {
			currentIdentifier; // Only used to trigger the useEffect hook
			if (_chainID === undefined) {
				_chainID = chainID;
			}

			const withBalance = [];
			for (const [networkID, eachNetwork] of Object.entries(allTokens)) {
				if (Number(networkID) !== _chainID) {
					continue;
				}

				for (const dest of Object.values(eachNetwork)) {
					const balance = getBalance({address: dest.address, chainID: dest.chainID});
					// force displaying extra tokens along with other tokens with balance
					if (balance.raw > 0n || isCustomToken({address: dest.address, chainID: dest.chainID})) {
						withBalance.push({...dest, balance});
					}
				}
			}
			return withBalance;
		},
		[allTokens, getBalance, isCustomToken, currentIdentifier, chainID]
	);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with or without balance. It will be
	 ** triggered when the allTokens or getBalance or isCustomToken or currentIdentifier changes.
	 *********************************************************************************************/
	const listTokens = useCallback(
		(_chainID?: number): TToken[] => {
			currentIdentifier; // Only used to trigger the useEffect hook
			if (_chainID === undefined) {
				_chainID = chainID;
			}

			const withBalance = [];
			for (const [networkID, eachNetwork] of Object.entries(allTokens)) {
				if (Number(networkID) !== _chainID) {
					continue;
				}

				for (const dest of Object.values(eachNetwork)) {
					const balance = getBalance({address: dest.address, chainID: dest.chainID});
					withBalance.push({...dest, balance});
				}
			}
			return withBalance;
		},
		[allTokens, getBalance, currentIdentifier, chainID]
	);

	/**********************************************************************************************
	 ** The listAllTokensWithBalance is similar to the listTokensWithBalance function, but it will
	 ** return all tokens from all networks. It will be triggered when the allTokens or getBalance
	 ** or currentIdentifier changes.
	 *********************************************************************************************/
	const listAllTokensWithBalance = useCallback((): TToken[] => {
		currentIdentifier; // Only used to trigger the useEffect hook

		const withBalance = [];
		for (const eachNetwork of Object.values(allTokens)) {
			for (const dest of Object.values(eachNetwork)) {
				const balance = getBalance({address: dest.address, chainID: dest.chainID});
				// force displaying extra tokens along with other tokens with balance
				if (balance.raw > 0n || isCustomToken({address: dest.address, chainID: dest.chainID})) {
					withBalance.push({...dest, balance});
				}
			}
		}
		return withBalance;
	}, [allTokens, getBalance, isCustomToken, currentIdentifier]);

	return {
		listAllTokensWithBalance,
		listTokensWithBalance,
		listTokens,
		isLoading,
		isLoadingOnCurrentChain,
		isLoadingOnChain,
		onRefresh
	};
}
