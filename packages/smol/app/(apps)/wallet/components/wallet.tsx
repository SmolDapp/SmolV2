'use client';

import {IconLoader} from '@lib/icons/IconLoader';
import {cl} from '@lib/utils/helpers';
import {isAddress, toAddress} from 'lib/utils/tools.addresses';
import Link from 'next/link';
import {useMemo, useState} from 'react';
import {isAddressEqual} from 'viem';
import {useAccount, useChainId} from 'wagmi';

import {usePrices} from '@smolContexts/WithPrices/WithPrices';
import {useTokenList} from '@smolContexts/WithTokenList';
import {useDeepCompareEffect, useDeepCompareMemo} from '@smolHooks/useDeepCompare';
import {useLoginModal} from '@smolHooks/web3/useLoginModal';
import {useTokensWithBalance} from '@smolHooks/web3/useTokensWithBalance';
import {WalletListHeader} from 'packages/smol/app/(apps)/wallet/components/WalletListHeader';
import {EmptyView} from 'packages/smol/common/EmptyView';
import {FetchedTokenButton} from 'packages/smol/common/FetchedTokenButton';
import {SmolTokenButton} from 'packages/smol/common/SmolTokenButton';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {ReactElement} from 'react';

export function Wallet(): ReactElement {
	const chainID = useChainId();
	const [searchValue, setSearchValue] = useState('');
	const {address} = useAccount();
	const onConnect = useLoginModal();
	const {addCustomToken} = useTokenList();
	const {getPrices, pricingHash} = usePrices();
	const {listTokensWithBalance, isLoadingOnCurrentChain} = useTokensWithBalance();
	const [prices, setPrices] = useState<Record<string, TNormalizedBN>>({});

	/**********************************************************************************************
	 ** The tokensToUse memoized value contains the list of tokens that we will use to display the
	 ** wallet. This is a wrapper aroung listTokensWithBalance that will return an empty array if
	 ** the tokens for the current chain are not loaded yet.
	 *********************************************************************************************/
	const tokensToUse = useMemo(() => {
		if (isLoadingOnCurrentChain) {
			return [];
		}
		return listTokensWithBalance();
	}, [listTokensWithBalance, isLoadingOnCurrentChain]);

	/**********************************************************************************************
	 ** The searchTokenAddress memoized value contains the address of the token that we are trying
	 ** to search. If the search value is a valid address and the token is not already in the list,
	 ** we will return the address of the token.
	 *********************************************************************************************/
	const searchTokenAddress = useMemo(() => {
		if (
			isAddress(searchValue) &&
			!tokensToUse.some(token => isAddressEqual(token.address, toAddress(searchValue)))
		) {
			return toAddress(searchValue);
		}
		return undefined;
	}, [tokensToUse, searchValue]);

	/**********************************************************************************************
	 ** The filteredTokens memoized value contains the list of tokens that we will display in the
	 ** wallet view once the user started to search for a token.
	 *********************************************************************************************/
	const filteredTokens = useDeepCompareMemo(() => {
		return tokensToUse.filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				token.name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
		);
	}, [searchValue, tokensToUse]);

	/**********************************************************************************************
	 ** This useDeepCompareEffect hook will be triggered when the filteredTokens, chainID or
	 ** pricingHash changes, indicating that we need to update the prices for the tokens.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useDeepCompareEffect(() => {
		if (filteredTokens.length === 0) {
			return;
		}
		const pricesForChain = getPrices(filteredTokens);
		setPrices(pricesForChain[chainID] || {});
	}, [filteredTokens, chainID, pricingHash]);

	const walletLayout = useMemo(() => {
		if (!address) {
			return <EmptyView onConnect={onConnect} />;
		}
		if (searchTokenAddress) {
			return (
				<FetchedTokenButton
					tokenAddress={searchTokenAddress}
					displayInfo
					chainID={chainID}
					onSelect={selected => {
						addCustomToken(selected);
						setSearchValue('');
					}}
				/>
			);
		}

		if (filteredTokens.length > 0) {
			return filteredTokens.map(token => (
				<Link
					className={'w-full'}
					href={`/send?tokens=${token.address}&values=${token.balance.raw}`}>
					<SmolTokenButton
						key={`${token.address}_${token.chainID}`}
						token={token}
						price={prices ? prices[toAddress(token.address)] : undefined}
						className={'cursor-pointer rounded-lg p-2 hover:bg-neutral-200'}
					/>
				</Link>
			));
		}
		if (isLoadingOnCurrentChain) {
			return null;
		}
		if (searchValue !== '') {
			return <p className={'text-center text-xs text-neutral-600'}>{'No tokens found'}</p>;
		}

		return <EmptyView />;
	}, [
		addCustomToken,
		address,
		filteredTokens,
		isLoadingOnCurrentChain,
		onConnect,
		prices,
		chainID,
		searchTokenAddress,
		searchValue
	]);

	return (
		<div className={'w-full max-w-108 gap-4'}>
			<input
				className={cl(
					'w-full border-neutral-400 rounded-lg bg-transparent py-3 px-4 mb-4 text-base',
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
				onChange={e => setSearchValue(e.target.value)}
			/>
			{!searchTokenAddress && address && !searchValue && <WalletListHeader />}
			<div className={'scrollable mb-8 flex flex-col items-center gap-2 pb-2'}>
				{walletLayout}
				{isLoadingOnCurrentChain && !!address && (
					<IconLoader className={'mt-4 size-4 animate-spin text-neutral-900'} />
				)}
			</div>
		</div>
	);
}
