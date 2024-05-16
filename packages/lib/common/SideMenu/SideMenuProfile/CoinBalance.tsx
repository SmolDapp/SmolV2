import {type ReactElement} from 'react';
import {useBalance} from 'wagmi';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {useIsMounted} from '@smolHooks/useIsMounted';
import {Counter} from '@lib/common/Counter';

export function CoinBalance(): ReactElement {
	const isMounted = useIsMounted();
	const {address} = useWeb3();
	const {chainID} = useChainID();
	const currentChain = getNetwork(chainID || 1).nativeCurrency;
	const {data: balance} = useBalance({chainId: chainID || 1, address});

	if (!isMounted) {
		return (
			<div>
				<small>{'Coin'}</small>
				<div className={'skeleton-lg h-8 w-2/3'} />
			</div>
		);
	}
	return (
		<div className={'truncate'}>
			<small>{currentChain.symbol || 'ETH'}</small>
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
