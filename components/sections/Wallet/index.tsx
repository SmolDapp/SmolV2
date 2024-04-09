import {type ReactElement, useMemo, useState} from 'react';
import {FetchedTokenButton} from 'components/designSystem/FetchedTokenButton';
import {SmolTokenButton} from 'components/designSystem/SmolTokenButton';
import {useTokensWithBalance} from 'hooks/useTokensWithBalance';
import {isAddressEqual} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import {IconWallet} from '@icons/IconWallet';
import {useDeepCompareMemo} from '@react-hookz/web';
import {IconLoader} from '@yearn-finance/web-lib/icons/IconLoader';

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

function EmptyWallet(): ReactElement {
	return (
		<div className={'mt-4 flex size-full flex-col items-center rounded-lg bg-neutral-200 px-11 py-[72px]'}>
			<div className={'mb-6 flex size-40 items-center justify-center rounded-full bg-neutral-0'}>
				<div className={'relative flex size-40 items-center justify-center rounded-full bg-white'}>
					<IconWallet className={'size-20'} />
				</div>
			</div>
			<div className={'flex flex-col items-center justify-center'}>
				<p className={'text-center text-base text-neutral-600'}>
					{
						"Oh no, we can't find your tokens. You can paste a token address above or... you know... buy some tokens."
					}
				</p>
			</div>
		</div>
	);
}

export function Wallet(): ReactElement {
	const {safeChainID} = useChainID();
	const [searchValue, set_searchValue] = useState('');
	const {address, onConnect} = useWeb3();
	const {addCustomToken} = useTokenList();
	const {tokensWithBalance, isLoading} = useTokensWithBalance();

	const searchTokenAddress = useMemo(() => {
		if (
			isAddress(searchValue) &&
			!tokensWithBalance.some(token => isAddressEqual(token.address, toAddress(searchValue)))
		) {
			return toAddress(searchValue);
		}
		return undefined;
	}, [tokensWithBalance, searchValue]);

	const filteredTokens = useDeepCompareMemo(() => {
		return tokensWithBalance.filter(
			token =>
				token.symbol.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				token.name.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase()) ||
				toAddress(token.address).toLocaleLowerCase().includes(searchValue.toLocaleLowerCase())
		);
	}, [searchValue, tokensWithBalance]);

	const {data: prices} = usePrices({tokens: filteredTokens, chainId: safeChainID});

	const walletLayout = useMemo(() => {
		if (isLoading) {
			return null;
		}
		if (!address) {
			return (
				<div className={'w-full'}>
					<p className={'text-center text-xs text-neutral-600'}>{'No wallet connected'}</p>
					<div className={'max-w-23 mt-6 w-full'}>
						<button
							onClick={() => {
								onConnect();
							}}
							className={
								'h-8 w-full rounded-lg bg-primary text-xs transition-colors hover:bg-primaryHover'
							}>
							{'Connect Wallet'}
						</button>
					</div>
				</div>
			);
		}
		if (searchTokenAddress) {
			return (
				<FetchedTokenButton
					tokenAddress={searchTokenAddress}
					displayInfo
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

		return <EmptyWallet />;
	}, [addCustomToken, address, filteredTokens, isLoading, onConnect, prices, searchTokenAddress, searchValue]);

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
