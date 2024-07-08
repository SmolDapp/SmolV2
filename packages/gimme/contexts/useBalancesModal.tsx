'use client';

import React, {createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {usePlausible} from 'next-plausible';
import {IconLoader} from 'lib/icons/IconLoader';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import {FetchedTokenButton} from '@gimmeDesignSystem/FetchedTokenButton';
import {GimmeTokenButton} from '@gimmeDesignSystem/GimmeTokenButton';
import {Dialog as HeadlessUiDialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';
import {useDeepCompareEffect, useDeepCompareMemo} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {usePopularTokens} from '@lib/contexts/usePopularTokens';
import {usePrices} from '@lib/contexts/usePrices';
import {IconCross} from '@lib/icons/IconCross';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';

import {useGetIsStablecoin} from '../hooks/helpers/useGetIsStablecoin';

import type {ReactElement, ReactNode} from 'react';
import type {TChainTokens, TDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {
	TBalancesCurtain,
	TBalancesCurtainContextAppProps,
	TBalancesCurtainContextProps,
	TBalancesCurtainOptions,
	TSelectCallback,
	TWalletLayoutProps
} from '@lib/types/curtain.balances';

const defaultProps: TBalancesCurtainContextProps = {
	shouldOpenCurtain: false,
	tokensWithBalance: [],
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
	const {isLoadingOnChain} = useTokensWithBalance();
	const {getPrices, pricingHash} = usePrices();
	const [prices, set_prices] = useState<TDict<TNormalizedBN>>({});

	/**********************************************************************************************
	 ** This useDeepCompareEffect hook will be triggered when the filteredTokens, safeChainID or
	 ** pricingHash changes, indicating that we need to update the prices for the tokens.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useDeepCompareEffect(() => {
		if (props.filteredTokens.length === 0) {
			return;
		}
		set_prices(getPrices(props.filteredTokens, props.chainID));
	}, [props.filteredTokens, props.chainID, pricingHash]);

	/**********************************************************************************************
	 ** If the wallet is not connected, we want to display a message and a button to connect.
	 ** Once the button is clicked, the wallet will be connected and the curtain will be closed.
	 *********************************************************************************************/
	if (!address) {
		return (
			<div className={'mt-16 flex w-full max-w-80 flex-col justify-center gap-6'}>
				<p className={'text-grey-700 text-center'}>{'Get started by connecting your wallet'}</p>
				<Button
					onClick={() => {
						onConnect();
						props.onOpenChange(false);
					}}
					className={'!rounded-2xl'}>
					{'Connect Wallet'}
				</Button>
			</div>
		);
	}

	/**********************************************************************************************
	 ** If the balances are loading, we want to display a spinner as placeholder.
	 *********************************************************************************************/
	if (isLoadingOnChain(props.chainID)) {
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
			<GimmeTokenButton
				key={`${token.address}_${token.chainID}`}
				token={token}
				price={prices ? prices[toAddress(token.address)] : undefined}
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
	return <p className={'text-grey-700 mt-28 text-center'}>{'No tokens found'}</p>;
}

function BalancesModalWrapper(props: {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onRefresh: () => Promise<TChainTokens>;
	children: ReactNode;
}): ReactElement {
	return (
		<Transition
			show={props.isOpen}
			as={Fragment}>
			<HeadlessUiDialog
				as={'div'}
				className={'relative z-[1000]'}
				onClose={() => props.onOpenChange(false)}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div className={'bg-grey-500/80 fixed inset-0 backdrop-blur-md  transition-opacity'} />
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto'}>
					<div className={'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0'}>
						<TransitionChild
							as={Fragment}
							enter={'ease-out duration-300'}
							enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
							enterTo={'opacity-100 translate-y-0 sm:scale-100'}
							leave={'ease-in duration-200'}
							leaveFrom={'opacity-100 translate-y-0 sm:scale-100'}
							leaveTo={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}>
							<DialogPanel
								className={cl(
									'relative overflow-hidden w-full flex flex-col items-center justify-center rounded-3xl !bg-white !p-2  transition-all',
									'sm:my-8 sm:max-w-[560px] sm:p-6'
								)}>
								<div className={'flex w-full justify-between p-4'}>
									<p className={'text-grey-900 font-bold'}>{'Select Token'}</p>
									<button
										className={'group'}
										onClick={() => props.onOpenChange(false)}>
										<IconCross
											className={
												'size-4 text-neutral-900 transition-colors group-hover:text-neutral-600'
											}
										/>
									</button>
								</div>
								<div className={'h-108 w-full '}>{props.children}</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</HeadlessUiDialog>
		</Transition>
	);
}

/**********************************************************************************************
 ** The BalancesCurtain component is responsible for displaying the curtain with the list of
 ** tokens the user has in their wallet and a search bar to filter them.
 *************************************************************************************************/
function BalancesModal(props: TBalancesCurtain): ReactElement {
	const plausible = usePlausible();
	const {address} = useWeb3();
	const [searchValue, set_searchValue] = useState('');
	const [filter, set_filter] = useState<'all' | 'stables' | 'other'>('all');

	const {getIsStablecoin} = useGetIsStablecoin();

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			plausible(PLAUSIBLE_EVENTS.OPEN_TOKEN_SELECTOR_CURTAIN);
			set_searchValue('');
			set_filter('all');
		}
	}, [props.isOpen, plausible]);

	/**********************************************************************************************
	 ** When user searches for a specific address, not present in the token list,
	 ** We want to display fetch this token and display it.
	 ** Memo function returns this search value if it is address and not present in the token list.
	 *********************************************************************************************/
	const searchTokenAddress = useMemo(() => {
		const isHere = props.tokensWithBalance.some(token => isAddressEqual(token.address, toAddress(searchValue)));

		if (isAddress(searchValue) && !isHere) {
			return toAddress(searchValue);
		}
		return undefined;
	}, [props.tokensWithBalance, searchValue]);

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
		const searchFor = searchValue.toLocaleLowerCase();
		if (searchFor === '') {
			return props.tokensWithBalance;
		}
		const filtering = props.tokensWithBalance.filter(
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

		return sorted.slice(0, 20);
	}, [props.tokensWithBalance, searchValue]);

	const filteredByCategory = useDeepCompareMemo(() => {
		if (filter === 'all') {
			return filteredTokens;
		}

		return filteredTokens.filter(token => {
			const isStablecoin = getIsStablecoin({address: token.address, chainID: token.chainID});
			if (filter === 'stables') {
				return isStablecoin;
			}
			return !isStablecoin;
		});
	}, [filter, filteredTokens, getIsStablecoin]);

	return (
		<BalancesModalWrapper
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			onRefresh={props.onRefresh}>
			<div className={'relative flex h-full flex-col gap-4'}>
				<input
					className={cl(
						'rounded-2xl py-3 px-4 text-base',
						'placeholder:transition-colors transition-all',
						'disabled:cursor-not-allowed disabled:opacity-40',
						'placeholder:text-grey-700 focus:border-grey-300 text-grey-800 caret-grey-800 border-transparent bg-grey-100 mx-4'
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

				<div className={'mx-4 mt-2 flex gap-2'}>
					<button
						className={cl(
							'text-grey-800 border-grey-200 hover:bg-grey-200 rounded-2xl border px-6 py-1 font-medium transition-all',
							filter === 'all' ? 'border-grey-800' : ''
						)}
						onClick={() => set_filter('all')}>
						{'All'}
					</button>
					<button
						className={cl(
							'text-grey-800 border-grey-200 hover:bg-grey-200 rounded-2xl border px-6 py-1 font-medium transition-all',
							filter === 'stables' ? 'border-grey-800' : ''
						)}
						onClick={() => set_filter('stables')}>
						{'Stables'}
					</button>
					<button
						className={cl(
							'text-grey-800 border-grey-200 hover:bg-grey-200 rounded-2xl border px-6 py-1 font-medium transition-all',
							filter === 'other' ? 'border-grey-800' : ''
						)}
						onClick={() => set_filter('other')}>
						{'Other'}
					</button>
				</div>

				<div className={cl('scrollable flex flex-col items-center gap-2 pb-2')}>
					<WalletLayout
						filteredTokens={filteredByCategory}
						selectedTokens={props.selectedTokens}
						onSelect={props.onSelect}
						searchTokenAddress={searchTokenAddress}
						onOpenChange={props.onOpenChange}
						chainID={Number(props.options.chainID)}
					/>
				</div>
			</div>
		</BalancesModalWrapper>
	);
}

const BalancesModalContext = createContext<TBalancesCurtainContextProps>(defaultProps);
export const BalancesModalContextApp = (props: TBalancesCurtainContextAppProps): React.ReactElement => {
	const {chainID} = useWeb3();
	const [shouldOpenCurtain, set_shouldOpenCurtain] = useState(false);
	const [currentCallbackFunction, set_currentCallbackFunction] = useState<TSelectCallback | undefined>(undefined);
	const {listTokensWithBalance, onRefresh} = useTokensWithBalance();
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
			onOpenCurtain,
			onCloseCurtain: (): void => set_shouldOpenCurtain(false)
		}),
		[shouldOpenCurtain, tokensToUse, onOpenCurtain]
	);

	return (
		<BalancesModalContext.Provider value={contextValue}>
			{props.children}
			<BalancesModal
				isOpen={shouldOpenCurtain}
				onRefresh={onRefresh}
				tokensWithBalance={tokensToUse}
				allTokens={allTokensToUse}
				selectedTokens={props.selectedTokens}
				onOpenChange={set_shouldOpenCurtain}
				onSelect={currentCallbackFunction}
				options={{
					chainID: options.chainID || chainID
				}}
			/>
		</BalancesModalContext.Provider>
	);
};

export const useBalancesModal = (): TBalancesCurtainContextProps => {
	const ctx = useContext(BalancesModalContext);
	if (!ctx) {
		throw new Error('BalancesModalContext not found');
	}
	return ctx;
};
