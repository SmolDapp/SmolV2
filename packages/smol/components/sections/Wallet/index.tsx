import {type ReactElement, useMemo, useState} from 'react';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import {useDeepCompareMemo} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {EmptyView} from '@lib/common/EmptyView';
import {FetchedTokenButton} from '@lib/common/FetchedTokenButton';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {IconLoader} from '@lib/icons/IconLoader';

import type {TPrice} from '@lib/utils/types/types';

function WalletListHeader(): ReactElement {
	return (
		<>
			<div className={'mb-2 flex justify-between text-xs'}>
				<p>{'Token'}</p>
				<p>{'Balance'}</p>
			</div>
			<div className={'h-px bg-neutral-400'} />
		</>
	);
}

export function Wallet(): ReactElement {
	const {safeChainID} = useChainID();
	const [searchValue, set_searchValue] = useState('');
	const {address, onConnect} = useWeb3();
	const {addCustomToken} = useTokenList();
	const {listTokensWithBalance, isLoading} = useTokensWithBalance();

	const searchTokenAddress = useMemo(() => {
		if (
			isAddress(searchValue) &&
			!listTokensWithBalance().some(token => isAddressEqual(token.address, toAddress(searchValue)))
		) {
			return toAddress(searchValue);
		}
		return undefined;
	}, [listTokensWithBalance, searchValue]);

	const filteredTokens = useDeepCompareMemo(() => {
		return listTokensWithBalance().filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				token.name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
		);
	}, [searchValue, listTokensWithBalance]);
	const {data: prices} = usePrices({tokens: filteredTokens, chainId: safeChainID}) as TPrice;

	const walletLayout = useMemo(() => {
		if (!address) {
			return <EmptyView onConnect={onConnect} />;
		}
		if (isLoading) {
			return null;
		}
		if (searchTokenAddress) {
			return (
				<FetchedTokenButton
					tokenAddress={searchTokenAddress}
					displayInfo
					chainID={safeChainID}
					onSelect={selected => {
						addCustomToken(selected);
						set_searchValue('');
					}}
				/>
			);
		}

		if (filteredTokens.length > 0) {
			return filteredTokens.map(token => (
				<SmolTokenButton
					key={`${token.address}_${token.chainID}`}
					token={token}
					price={prices ? prices[token.address] : undefined}
				/>
			));
		}

		if (searchValue !== '') {
			return <p className={'text-center text-xs text-neutral-600'}>{'No tokens found'}</p>;
		}

		return <EmptyView />;
	}, [
		addCustomToken,
		address,
		filteredTokens,
		isLoading,
		onConnect,
		prices,
		safeChainID,
		searchTokenAddress,
		searchValue
	]);

	return (
		<div className={'max-w-108 w-full gap-4'}>
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
				onChange={e => set_searchValue(e.target.value)}
			/>
			{!searchTokenAddress && address && !searchValue && !isLoading && <WalletListHeader />}
			<div className={'scrollable mb-8 flex flex-col items-center gap-2 pb-2'}>
				{walletLayout}
				{isLoading && !!address && <IconLoader className={'mt-2 size-4 animate-spin text-neutral-900'} />}
			</div>
		</div>
	);
}
