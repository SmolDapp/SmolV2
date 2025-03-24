'use client';

import {useIsMounted} from 'usehooks-ts';
import {useAccount, useBalance, useChainId} from 'wagmi';

import {Counter} from '@lib/components/Counter';

import type {ReactElement} from 'react';

export function CoinBalance(): ReactElement {
	const isMounted = useIsMounted();
	const {address, chain} = useAccount();
	const chainID = useChainId();
	const {data: balance} = useBalance({chainId: chainID || 1, address});

	if (!isMounted()) {
		return (
			<div>
				<small>{'Coin'}</small>
				<div className={'skeleton-lg h-8 w-2/3'} />
			</div>
		);
	}
	return (
		<div className={'truncate'}>
			<small>{chain?.nativeCurrency?.symbol || 'ETH'}</small>
			<strong className={'truncate'}>
				<Counter
					className={'truncate text-base leading-8'}
					value={Number(balance?.formatted || 0)}
					decimals={6}
				/>
			</strong>
		</div>
	);
}
