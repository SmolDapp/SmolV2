'use client';

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {usePlausible} from 'next-plausible';
import {isAddressEqual} from 'viem';
import useSWR from 'swr';
import {LayoutGroup, motion} from 'framer-motion';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import {baseFetcher} from '@builtbymom/web3/utils/fetchers';
import * as Dialog from '@radix-ui/react-dialog';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import {FetchedTokenButton} from '@lib/common/FetchedTokenButton';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {usePopularTokens} from '@lib/contexts/usePopularTokens';
import {IconAppSwap} from '@lib/icons/IconApps';
import {IconGears} from '@lib/icons/IconGears';
import {IconLoader} from '@lib/icons/IconLoader';
import {CurtainContent} from '@lib/primitives/Curtain';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';

import type {ReactElement, ReactNode} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {
	TBalancesCurtain,
	TBalancesCurtainContextAppProps,
	TBalancesCurtainContextProps,
	TBalancesCurtainOptions,
	TSelectCallback,
	TWalletLayoutProps
} from '@lib/types/curtain.balances';
import type {TPrice} from '@lib/utils/types/types';

const defaultProps: TBalancesCurtainContextProps = {
	shouldOpenCurtain: false,
	tokensWithBalance: [],
	isLoading: false,
	onOpenCurtain: (): void => undefined,
	onCloseCurtain: (): void => undefined
};

/**************************************************************************************************
 ** The WalletLayout component is responsible for displaying the main content of the
 ** BalancesCurtain component. It displays the list of tokens the user has in their wallet.
 *************************************************************************************************/
function WalletLayout(props: TWalletLayoutProps): ReactNode {
	const {address, onConnect} = useWeb3();
	const {addCustomToken} = useTokenList();
	const {safeChainID} = useChainID();
	const {data: prices} = usePrices({tokens: props.filteredTokens, chainId: safeChainID}) as TPrice;

	/**********************************************************************************************
	 ** If the wallet is not connected, we want to display a message and a button to connect.
	 ** Once the button is clicked, the wallet will be connected and the curtain will be closed.
	 *********************************************************************************************/
	if (!address) {
		return (
			<div className={'w-full'}>
				<p className={'text-center text-xs text-neutral-600'}>{'No wallet connected'}</p>
				<div className={'max-w-23 mt-6 w-full'}>
					<button
						onClick={() => {
							onConnect();
							props.onOpenChange(false);
						}}
						className={'bg-primary hover:bg-primaryHover h-8 w-full rounded-lg text-xs transition-colors'}>
						{'Connect Wallet'}
					</button>
				</div>
			</div>
		);
	}

	/**********************************************************************************************
	 ** If the balances are loading, we want to display a spinner as placeholder.
	 *********************************************************************************************/
	if (props.isLoading) {
		return <IconLoader className={'mt-2 size-4 animate-spin text-neutral-900'} />;
	}

	/**********************************************************************************************
	 ** If the user searches for a specific address, not present in the token list, we want to
	 ** display fetch this token and display it.
	 *********************************************************************************************/
	if (props.searchTokenAddress) {
		return (
			<FetchedTokenButton
				chainID={props.chainID}
				tokenAddress={props.searchTokenAddress}
				onSelect={selected => {
					props.onSelect?.(selected);
					props.onOpenChange(false);
					addCustomToken(selected);
				}}
			/>
		);
	}

	/**********************************************************************************************
	 ** If, after filtering, there are tokens to display, we want to display them.
	 *********************************************************************************************/
	if (props.filteredTokens.length > 0) {
		return props.filteredTokens.map(token => (
			<SmolTokenButton
				key={`${token.address}_${token.chainID}`}
				token={token}
				price={prices ? prices[token.address] : undefined}
				isDisabled={
					props.selectedTokens?.some(
						t => isAddressEqual(t.address, token.address) && t.chainID === token.chainID
					) || false
				}
				onClick={() => {
					props.onSelect?.(token);
					props.onOpenChange(false);
				}}
			/>
		));
	}

	/**********************************************************************************************
	 ** Otherwise, if we have no tokens to display, we want to display a message.
	 *********************************************************************************************/
	return <p className={'text-center text-xs text-neutral-600'}>{'No tokens found'}</p>;
}

/**************************************************************************************************
 ** The TokenListSelectorLayout component is responsible for displaying the list of token lists
 ** the user can select. This list is fetched from the tokenLists repository, and if not stored
 ** anywhere. After every app refresh, the user will need to select the lists again.
 *************************************************************************************************/
function TokenListSelectorLayout(): ReactNode {
	const {listsURI, onChangeListsURI} = usePopularTokens();
	const {data} = useSWR('https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/summary.json', baseFetcher);

	const relevantData = useMemo(() => {
		const lists = ((data as any)?.lists || []) as {
			URI: string;
			decription: string;
			logoURI: string;
			name: string;
			tokenCount: number;
		}[];
		const excludedTheses = ['(Static)', 'Token Pairs', 'Token Pools', 'RouteScan', 'Uniswap Labs'];
		const filteredLists = lists.filter(list => !excludedTheses.some(excluded => list.name.includes(excluded)));
		return filteredLists;
	}, [data]);

	//Sort by if in selectedLists, then by tokenCount
	const sortedData = useMemo(() => {
		const inSelected = relevantData.filter(e => listsURI.includes(e.URI));
		const notSelected = relevantData.filter(e => !listsURI.includes(e.URI));
		return [...inSelected, ...notSelected];
	}, [relevantData, listsURI]);

	return (
		<LayoutGroup>
			<div className={'scrollable mb-8 flex w-full flex-col items-center gap-2 pb-2'}>
				{(sortedData || []).map(e => (
					<motion.div
						layout
						key={e.URI}
						onClick={() => {
							if (listsURI.includes(e.URI)) {
								onChangeListsURI(prev => prev.filter(el => el !== e.URI));
							} else {
								onChangeListsURI(prev => [...prev, e.URI]);
							}
						}}
						className={cl(
							'flex items-center gap-2 p-2 rounded-lg text-neutral-900 w-full relative',
							'bg-neutral-200 hover:bg-neutral-300 transition-colors cursor-pointer'
						)}>
						<div className={'bg-neutral-0 flex size-10 items-center justify-center rounded-lg'}>
							<ImageWithFallback
								alt={e.name}
								src={e.logoURI}
								altSrc={e.logoURI}
								unoptimized
								className={'p-1'}
								width={40}
								height={40}
							/>
						</div>
						<div>
							<p className={'text-sm font-bold'}>{e.name}</p>
							<p className={'text-xs text-neutral-600'}>{`${e.tokenCount} tokens`}</p>
						</div>
						<div className={'absolute right-2'}>
							<input
								type={'checkbox'}
								className={'text-primary accent-primary rounded-lg focus:ring-0 focus:ring-offset-0'}
								checked={listsURI.includes(e.URI)}
							/>
						</div>
					</motion.div>
				))}
			</div>
		</LayoutGroup>
	);
}

/**********************************************************************************************
 ** The BalancesCurtain component is responsible for displaying the curtain with the list of
 ** tokens the user has in their wallet and a search bar to filter them.
 *************************************************************************************************/
function BalancesCurtain(props: TBalancesCurtain): ReactElement {
	const plausible = usePlausible();
	const {address} = useWeb3();
	const [searchValue, set_searchValue] = useState('');
	const [tab, set_tab] = useState(0);

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			plausible(PLAUSIBLE_EVENTS.OPEN_TOKEN_SELECTOR_CURTAIN);
			set_searchValue('');
			set_tab(0);
		}
	}, [props.isOpen, plausible]);

	/**********************************************************************************************
	 ** When user searches for a specific address, not present in the token list,
	 ** We want to display fetch this token and display it.
	 ** Memo function returns this search value if it is address and not present in the token list.
	 *********************************************************************************************/
	const searchTokenAddress = useMemo(() => {
		const listToUse = tab === 0 ? props.tokensWithBalance : props.allTokens;
		const isHere = listToUse.some(token => isAddressEqual(token.address, toAddress(searchValue)));

		if (isAddress(searchValue) && !isHere) {
			return toAddress(searchValue);
		}
		return undefined;
	}, [tab, props.tokensWithBalance, props.allTokens, searchValue]);

	/**********************************************************************************************
	 ** Memo function that filters the tokens user have on the search value.
	 ** Only tokens the symbol or the address of which includes the search value will be returned.
	 *********************************************************************************************/
	function getDifference(item: string, searchTerm: string): number {
		if (item.startsWith(searchTerm)) {
			return item.length - searchTerm.length; // Difference is the extra characters beyond the search term
		}
		return item.length + searchTerm.length; // Large difference if not starting with searchTerm
	}

	const filteredTokens = useDeepCompareMemo(() => {
		const listToUse = tab === 0 ? props.tokensWithBalance : props.allTokens;
		const searchFor = searchValue.toLocaleLowerCase();
		if (searchFor === '') {
			return listToUse;
		}
		const filtering = listToUse.filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchFor) ||
				token.name.toLocaleLowerCase().includes(searchFor) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchFor)
		);

		const sorted = filtering
			.map(item => ({
				item,
				exactness:
					item.name.toLocaleLowerCase() === searchFor || item.symbol.toLocaleLowerCase() === searchFor
						? 1
						: 0,
				diffName: getDifference(item.name.toLocaleLowerCase(), searchFor),
				diffSymbol: getDifference(item.symbol.toLocaleLowerCase(), searchFor)
			}))
			.sort(
				(a, b) =>
					b.exactness - a.exactness || Math.min(a.diffName, a.diffSymbol) - Math.min(b.diffName, b.diffSymbol)
			) // Sort by exactness first, then by the smallest ascending difference of name or symbol
			.map(sortedItem => sortedItem.item); // Return sorted items

		if (tab === 0) {
			return sorted;
		}
		return sorted.slice(0, 20);
	}, [tab, props.tokensWithBalance, props.allTokens, searchValue]);

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<div className={'flex items-center gap-x-3'}>
							<h3 className={'mr-2 font-bold'}>{'Your Wallet'}</h3>
							<button
								onClick={props.onRefresh}
								className={'text-neutral-600 hover:text-neutral-900'}>
								<IconAppSwap className={'size-3'} />
							</button>
						</div>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<input
							className={cl(
								'w-full border-neutral-400 rounded-lg bg-transparent py-3 px-4 text-base',
								'text-neutral-900 placeholder:text-neutral-600 caret-neutral-700',
								'focus:placeholder:text-neutral-300 placeholder:transition-colors',
								'focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40'
							)}
							type={'text'}
							placeholder={'0x... or Name'}
							autoComplete={'off'}
							autoCorrect={'off'}
							spellCheck={'false'}
							value={searchValue}
							disabled={!address}
							onChange={e => set_searchValue(e.target.value)}
						/>
						{props.options.withTabs ? (
							<div className={'flex items-center gap-2'}>
								<button
									onClick={() => set_tab(0)}
									className={cl(
										'w-full',
										'rounded-xl p-2 text-center text-sm transition-all hover:bg-neutral-300',
										tab === 0 ? 'bg-neutral-300 text-neutral-900' : 'bg-neutral-0 text-neutral-600'
									)}>
									<p>{'Your tokens'}</p>
								</button>
								<button
									onClick={() => set_tab(1)}
									className={cl(
										'w-full',
										'rounded-xl p-2 text-center text-sm transition-all hover:bg-neutral-300',
										tab === 1 ? 'bg-neutral-300 text-neutral-900' : 'bg-neutral-0 text-neutral-600'
									)}>
									<p>{'All tokens'}</p>
								</button>
								<button
									onClick={() => set_tab(3)}
									className={cl(
										'rounded-xl p-2 text-center text-sm transition-all hover:bg-neutral-300',
										tab === 3 ? 'bg-neutral-300 text-neutral-900' : 'bg-neutral-0 text-neutral-600'
									)}>
									<IconGears className={'size-4'} />
								</button>
							</div>
						) : null}

						{tab === 0 || tab === 1 ? (
							<div className={'scrollable mb-8 flex flex-col items-center gap-2 pb-2'}>
								<WalletLayout
									filteredTokens={filteredTokens}
									selectedTokens={props.selectedTokens}
									isLoading={props.isLoading}
									onSelect={props.onSelect}
									searchTokenAddress={searchTokenAddress}
									onOpenChange={props.onOpenChange}
									chainID={Number(props.options.chainID)}
								/>
							</div>
						) : (
							<TokenListSelectorLayout />
						)}
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}

const BalancesCurtainContext = createContext<TBalancesCurtainContextProps>(defaultProps);
export const BalancesCurtainContextApp = (props: TBalancesCurtainContextAppProps): React.ReactElement => {
	const {chainID} = useWeb3();
	const [shouldOpenCurtain, set_shouldOpenCurtain] = useState(false);
	const [currentCallbackFunction, set_currentCallbackFunction] = useState<TSelectCallback | undefined>(undefined);
	const {listTokensWithBalance, isLoading, onRefresh} = useTokensWithBalance();
	const {listTokens} = usePopularTokens();
	const [tokensToUse, set_tokensToUse] = useState<TToken[]>([]);
	const [allTokensToUse, set_allTokensToUse] = useState<TToken[]>([]);
	const [options, set_options] = useState<TBalancesCurtainOptions>({chainID: -1});

	/**********************************************************************************************
	 ** We want to update the chainIDToUse when the chainID changes.
	 ** This is to keep the chain we are displaying the tokens for in sync with the chainID, even
	 ** when we are getting new tokens from the listTokensWithBalance hook.
	 *********************************************************************************************/
	useEffect((): void => {
		set_options(prev => ({...prev, chainID}));
	}, [chainID]);

	/**********************************************************************************************
	 ** When the listTokensWithBalance hook is updated, we are getting a new list of tokens for
	 ** the selected chainID. We want to update the tokensToUse state with this new list, but only
	 ** based on the chainIDToUse state, to avoid having the "local" state to chainID 10 while the
	 ** user's chainID is 1 which would result in displaying the tokens for chain 1 instead of 10.
	 *********************************************************************************************/
	useEffect((): void => {
		set_tokensToUse(listTokensWithBalance(options.chainID));
		set_allTokensToUse(listTokens(options.chainID));
	}, [listTokensWithBalance, options.chainID, listTokens]);

	/**********************************************************************************************
	 ** Callback function that is called when the user click the button to open the curtain. Two
	 ** arguments are expected, the first one is the callback function that should be called when
	 ** the user selects a token, and the second one is the chainID for which the tokens should be
	 ** displayed.
	 ** The chainID is optional, if it is not provided, the chainID from the useWeb3 hook will be
	 ** used.
	 *********************************************************************************************/
	const onOpenCurtain: TBalancesCurtainContextProps['onOpenCurtain'] = useCallback(
		(callbackFn, _options): void => {
			if (_options?.chainID) {
				set_tokensToUse(listTokensWithBalance(_options.chainID));
				set_allTokensToUse(listTokens(_options.chainID));
				set_options(_options);
			}
			set_currentCallbackFunction(() => callbackFn);
			set_shouldOpenCurtain(true);
		},
		[listTokensWithBalance, listTokens]
	);

	/**********************************************************************************************
	 ** Context value that is passed to all children of this component.
	 *********************************************************************************************/
	const contextValue = useDeepCompareMemo(
		(): TBalancesCurtainContextProps => ({
			shouldOpenCurtain,
			tokensWithBalance: tokensToUse,
			isLoading,
			onOpenCurtain,
			onCloseCurtain: (): void => set_shouldOpenCurtain(false)
		}),
		[isLoading, shouldOpenCurtain, tokensToUse, onOpenCurtain]
	);

	return (
		<BalancesCurtainContext.Provider value={contextValue}>
			{props.children}
			<BalancesCurtain
				isOpen={shouldOpenCurtain}
				onRefresh={onRefresh}
				tokensWithBalance={tokensToUse}
				allTokens={allTokensToUse}
				isLoading={isLoading}
				selectedTokens={props.selectedTokens}
				onOpenChange={set_shouldOpenCurtain}
				onSelect={currentCallbackFunction}
				options={{
					chainID: options.chainID || chainID,
					withTabs: options.withTabs || false
				}}
			/>
		</BalancesCurtainContext.Provider>
	);
};

export const useBalancesCurtain = (): TBalancesCurtainContextProps => {
	const ctx = useContext(BalancesCurtainContext);
	if (!ctx) {
		throw new Error('BalancesCurtainContext not found');
	}
	return ctx;
};
