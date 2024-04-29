import {useMemo, useState} from 'react';
import {serialize} from 'wagmi';
import XXH from 'xxhashjs';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareEffect, useDeepCompareMemo} from '@react-hookz/web';
import {ETH_TOKEN_ADDRESS} from '@yearn-finance/web-lib/utils/constants';

import type {TChainTokens, TDict, TToken} from '@builtbymom/web3/types';

function createUniqueID(msg: string): string {
	const hash = XXH.h32(0x536d6f6c).update(msg).digest().toString(16);
	return hash;
}

export function useTokensWithBalance(): {
	tokensWithBalance: TToken[];
	isLoading: boolean;
	onRefresh: () => Promise<TChainTokens>;
} {
	const {chainID, safeChainID} = useChainID();
	const {balances, getBalance, isLoading, onRefresh} = useWallet();
	const [allTokens, set_allTokens] = useState<TDict<TToken>>({});
	const {currentNetworkTokenList, isCustomToken} = useTokenList();

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
		const possibleDestinationsTokens: TDict<TToken> = {};
		const {nativeCurrency} = getNetwork(safeChainID);
		if (nativeCurrency) {
			possibleDestinationsTokens[ETH_TOKEN_ADDRESS] = {
				address: ETH_TOKEN_ADDRESS,
				chainID: chainID,
				name: nativeCurrency.name,
				symbol: nativeCurrency.symbol,
				decimals: nativeCurrency.decimals,
				value: 0,
				balance: zeroNormalizedBN,
				logoURI: `${process.env.SMOL_ASSETS_URL}/token/${safeChainID}/${ETH_TOKEN_ADDRESS}/logo-32.png`
			};
		}
		for (const eachToken of Object.values(currentNetworkTokenList)) {
			if (eachToken.address === toAddress('0x0000000000000000000000000000000000001010')) {
				continue; //ignore matic erc20
			}
			if (eachToken.chainID === chainID) {
				possibleDestinationsTokens[toAddress(eachToken.address)] = eachToken;
			}
		}
		set_allTokens(possibleDestinationsTokens);
	}, [currentNetworkTokenList, chainID]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with balance. It will be triggered
	 ** when the allTokens or getBalance or isCustomToken or currentIdentifier changes.
	 *********************************************************************************************/
	const tokensWithBalance = useDeepCompareMemo((): TToken[] => {
		// Only used to trigger the useEffect hook
		currentIdentifier;

		const withBalance = [];
		for (const dest of Object.values(allTokens)) {
			const balance = getBalance({address: dest.address, chainID: dest.chainID});
			// force displaying extra tokens along with other tokens with balance
			if (balance.raw > 0n || isCustomToken({address: dest.address, chainID: dest.chainID})) {
				withBalance.push({...dest, balance});
			}
		}
		return withBalance;
	}, [allTokens, getBalance, isCustomToken, currentIdentifier]);

	return {tokensWithBalance, isLoading, onRefresh};
}
