'use client';

import {zeroNormalizedBN} from '@lib/utils/numbers';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {useDeepCompareEffect} from '@react-hookz/web';
import {ethTokenAddress, toAddress} from 'lib/utils/tools.addresses';
import {useCallback, useMemo, useState} from 'react';
import {serialize, useChainId, useChains} from 'wagmi';

import {useWallet} from '@smolContexts/useWallet';
import {useTokenList} from '@smolContexts/WithTokenList';

import type {TChainERC20Tokens, TERC20TokensWithBalance} from '@lib/utils/tools.erc20';

export function useTokensWithBalance(): {
	listAllTokensWithBalance: () => TERC20TokensWithBalance[];
	listTokensWithBalance: (chainID?: number) => TERC20TokensWithBalance[];
	listTokens: (chainID?: number) => TERC20TokensWithBalance[];
	isLoading: boolean;
	isLoadingOnCurrentChain: boolean;
	isLoadingOnChain: (chainID?: number) => boolean;
	onRefresh: () => Promise<TChainERC20Tokens>;
} {
	const chainID = useChainId();
	const chains = useChains();
	const {balances, getBalance, isLoading, isLoadingOnCurrentChain, isLoadingOnChain, onRefresh} = useWallet();
	const [allTokens, setAllTokens] = useState<Record<number, Record<string, TERC20TokensWithBalance>>>({});
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
	 ** This useEffect hook will be triggered when the currentNetworkTokenList or chainID
	 ** changes, indicating that we need to update the list of tokens with balance to match the
	 ** current network.
	 *********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: Record<number, Record<string, TERC20TokensWithBalance>> = {};
		for (const [networkID, eachNetwork] of Object.entries(tokenLists)) {
			if (!possibleDestinationsTokens[Number(networkID)]) {
				possibleDestinationsTokens[Number(networkID)] = {};
				const network = chains.find(chain => chain.id === Number(networkID));
				if (network) {
					if (network.nativeCurrency) {
						possibleDestinationsTokens[Number(networkID)][ethTokenAddress] = {
							address: ethTokenAddress,
							chainID: Number(networkID),
							name: network.nativeCurrency.name,
							symbol: network.nativeCurrency.symbol,
							decimals: network.nativeCurrency.decimals,
							value: 0,
							balance: zeroNormalizedBN,
							logoURI: `${process.env.SMOL_ASSETS_URL}/token/${Number(networkID)}/${ethTokenAddress}/logo-32.png`
						};
					}
				}
			}

			for (const eachToken of Object.values(eachNetwork)) {
				if (eachToken.address === toAddress('0x0000000000000000000000000000000000001010')) {
					continue; //ignore matic erc20
				}
				possibleDestinationsTokens[Number(networkID)][toAddress(eachToken.address)] = eachToken;
			}
		}
		setAllTokens(possibleDestinationsTokens);
	}, [tokenLists, chains]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with balance. It will be triggered
	 ** when the allTokens or getBalance or isCustomToken or currentIdentifier changes.
	 *********************************************************************************************/
	const listTokensWithBalance = useCallback(
		(_chainID?: number): TERC20TokensWithBalance[] => {
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
		(_chainID?: number): TERC20TokensWithBalance[] => {
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
	const listAllTokensWithBalance = useCallback((): TERC20TokensWithBalance[] => {
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
