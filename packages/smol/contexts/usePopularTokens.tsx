import {zeroNormalizedBN} from '@lib/utils/numbers';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {useDeepCompareEffect} from '@react-hookz/web';
import axios from 'axios';
import {ethTokenAddress, toAddress} from 'lib/utils/tools.addresses';
import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {serialize, useChainId, useChains} from 'wagmi';

import {useWallet} from '@smolContexts/useWallet';
import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TERC20TokenList, TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {AxiosResponse} from 'axios';
import type {Dispatch, ReactElement, SetStateAction} from 'react';

type TPopularTokensProps = {
	listsURI: string[];
	onChangeListsURI: Dispatch<SetStateAction<string[]>>;
	listTokens: (chainID?: number) => TERC20TokensWithBalance[];
};

const defaultProps: TPopularTokensProps = {
	listsURI: [],
	onChangeListsURI: () => {},
	listTokens: () => []
};
const POPULAR_LIST_URI = 'https://raw.githubusercontent.com/smoldapp/tokenLists/main/lists/popular.json';
const PopularTokensContext = createContext<TPopularTokensProps>(defaultProps);
export const WithPopularTokens = ({children}: {children: ReactElement}): ReactElement => {
	const chainID = useChainId();
	const chains = useChains();
	const {balances, getBalance} = useWallet();
	const [listsURI, setListsURI] = useState<string[]>([POPULAR_LIST_URI]);
	const [allTokens, setAllTokens] = useState<Record<number, Record<TAddress, TERC20TokensWithBalance>>>({});
	const [tokenList, setTokenList] = useState<Record<number, Record<TAddress, TERC20TokensWithBalance>>>({});
	const hashList = useMemo((): string => listsURI.join(','), [listsURI]);

	/**********************************************************************************************
	 ** Balances is an object with multiple level of depth. We want to create a unique hash from
	 ** it to know when it changes. This new hash will be used to trigger the useEffect hook.
	 ** We will use classic hash function to create a hash from the balances object.
	 *********************************************************************************************/
	const currentIdentifier = useMemo(() => {
		const hash = createUniqueID(serialize(balances));
		return hash;
	}, [balances]);

	/************************************************************************************
	 ** This is the main function that will be called when the component mounts and
	 ** whenever the hashList changes. It will fetch all the token lists from the
	 ** hashList and then add them to the tokenList state.
	 ** This is the list coming from the props.
	 ************************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		const unhashedLists = hashList.split(',').filter(Boolean);
		if (unhashedLists.length === 0) {
			setTokenList({});
			return;
		}
		const responses = await Promise.allSettled(
			unhashedLists.map(async (eachURI: string): Promise<AxiosResponse> => axios.get(eachURI))
		);
		const tokens: TERC20TokenList['tokens'] = [];
		for (const [, response] of responses.entries()) {
			if (response.status === 'fulfilled') {
				tokens.push(...(response.value.data as TERC20TokenList).tokens);
			}
		}

		const tokenListTokens: Record<number, Record<TAddress, TERC20TokensWithBalance>> = {};
		for (const eachToken of tokens) {
			if (!tokenListTokens[eachToken.chainId]) {
				tokenListTokens[eachToken.chainId] = {};
			}
			if (!tokenListTokens[eachToken.chainId][toAddress(eachToken.address)]) {
				tokenListTokens[eachToken.chainId][toAddress(eachToken.address)] = {
					address: eachToken.address,
					name: eachToken.name,
					symbol: eachToken.symbol,
					decimals: eachToken.decimals,
					chainID: eachToken.chainId,
					logoURI: eachToken.logoURI,
					value: 0,
					balance: zeroNormalizedBN
				};
			}
		}
		setTokenList(tokenListTokens);
	}, [hashList]);

	/**********************************************************************************************
	 ** This useEffect hook will be triggered when the currentNetworkTokenList or chainID
	 ** changes, indicating that we need to update the list of tokens with balance to match the
	 ** current network.
	 *********************************************************************************************/
	useDeepCompareEffect((): void => {
		const possibleDestinationsTokens: Record<number, Record<TAddress, TERC20TokensWithBalance>> = {};
		for (const [networkID, eachNetwork] of Object.entries(tokenList)) {
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
	}, [tokenList, chains]);

	/**********************************************************************************************
	 ** This function will be used to get the list of tokens with or without balance. It will be
	 ** triggered when the allTokens or getBalance or isCustomToken or currentIdentifier changes.
	 *********************************************************************************************/
	const listTokens = useCallback(
		(_chainID?: number): TERC20TokensWithBalance[] => {
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

			//We need to do the same with balances
			for (const [networkID, eachNetwork] of Object.entries(balances)) {
				if (Number(networkID) !== _chainID) {
					continue;
				}

				for (const token of Object.values(eachNetwork)) {
					if (token) {
						const balance = getBalance({address: token.address, chainID: token.chainID});
						withBalance.push({...token, balance});
					}
				}
			}

			const noDuplicates: TERC20TokensWithBalance[] = [];
			for (const token of withBalance) {
				if (!noDuplicates.find(t => t.address === token.address && t.chainID === token.chainID)) {
					noDuplicates.push(token);
				}
			}

			return noDuplicates;
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[allTokens, getBalance, currentIdentifier, chainID]
	);

	return (
		<PopularTokensContext.Provider
			value={{
				listTokens,
				listsURI,
				onChangeListsURI: setListsURI
			}}>
			{children}
		</PopularTokensContext.Provider>
	);
};

export const usePopularTokens = (): TPopularTokensProps => {
	const ctx = useContext(PopularTokensContext);
	if (!ctx) {
		throw new Error('PopularTokensContext not found');
	}
	return ctx;
};
