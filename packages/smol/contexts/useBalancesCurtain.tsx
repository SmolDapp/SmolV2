'use client';

import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import {FetchedTokenButton} from '@lib/common/FetchedTokenButton';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {IconLoader} from '@lib/icons/IconLoader';
import {CurtainContent} from '@lib/primitives/Curtain';

import type {ReactElement, ReactNode} from 'react';
import type {TPrice} from '@lib/utils/types/types';
import type {
	TBalancesCurtain,
	TBalancesCurtainContextAppProps,
	TBalancesCurtainContextProps,
	TSelectCallback,
	TWalletLayoutProps
} from './useBalancesCurtain.types';

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
				isDisabled={props.selectedTokenAddresses?.includes(token.address) || false}
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

/**********************************************************************************************
 ** The BalancesCurtain component is responsible for displaying the curtain with the list of
 ** tokens the user has in their wallet and a search bar to filter them.
 *************************************************************************************************/
function BalancesCurtain(props: TBalancesCurtain): ReactElement {
	const [searchValue, set_searchValue] = useState('');
	const {address} = useWeb3();

	/**********************************************************************************************
	 ** When the curtain is opened, we want to reset the search value.
	 ** This is to avoid preserving the state accross multiple openings.
	 *********************************************************************************************/
	useEffect((): void => {
		if (props.isOpen) {
			set_searchValue('');
		}
	}, [props.isOpen]);

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
	const filteredTokens = useDeepCompareMemo(() => {
		const searchFor = searchValue.toLocaleLowerCase();
		return props.tokensWithBalance.filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchFor) ||
				token.name.toLocaleLowerCase().includes(searchFor) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchFor)
		);
	}, [searchValue, props.tokensWithBalance]);

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Your Wallet'}</h3>
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
						<div className={'scrollable mb-8 flex flex-col items-center gap-2 pb-2'}>
							<WalletLayout
								filteredTokens={filteredTokens}
								selectedTokenAddresses={props.selectedTokenAddresses}
								isLoading={props.isLoading}
								onSelect={props.onSelect}
								searchTokenAddress={searchTokenAddress}
								onOpenChange={props.onOpenChange}
							/>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}

const BalancesCurtainContext = createContext<TBalancesCurtainContextProps>(defaultProps);
export const BalancesCurtainContextApp = (props: TBalancesCurtainContextAppProps): React.ReactElement => {
	const [shouldOpenCurtain, set_shouldOpenCurtain] = useState(false);
	const [currentCallbackFunction, set_currentCallbackFunction] = useState<TSelectCallback | undefined>(undefined);
	const {tokensWithBalance, isLoading} = useTokensWithBalance();

	/**********************************************************************************************
	 ** Context value that is passed to all children of this component.
	 *********************************************************************************************/
	const contextValue = useDeepCompareMemo(
		(): TBalancesCurtainContextProps => ({
			shouldOpenCurtain,
			tokensWithBalance,
			isLoading,
			onOpenCurtain: (callbackFn): void => {
				set_currentCallbackFunction(() => callbackFn);
				set_shouldOpenCurtain(true);
			},
			onCloseCurtain: (): void => set_shouldOpenCurtain(false)
		}),
		[isLoading, shouldOpenCurtain, tokensWithBalance]
	);

	return (
		<BalancesCurtainContext.Provider value={contextValue}>
			{props.children}
			<BalancesCurtain
				isOpen={shouldOpenCurtain}
				tokensWithBalance={tokensWithBalance}
				isLoading={isLoading}
				selectedTokenAddresses={props.selectedTokenAddresses}
				onOpenChange={set_shouldOpenCurtain}
				onSelect={currentCallbackFunction}
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
