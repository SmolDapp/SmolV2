import {type ReactElement} from 'react';
import {Warning} from 'lib/common';
import {useBalances} from '@builtbymom/web3/hooks/useBalances.multichains';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {IconLoader} from '@yearn-finance/web-lib/icons/IconLoader';

import {SmolTokenButton} from './SmolTokenButton';

import type {TAddress, TToken} from '@builtbymom/web3/types';

export function FetchedTokenButton({
	tokenAddress,
	displayInfo = false,
	onSelect
}: {
	tokenAddress: TAddress;
	displayInfo?: boolean;
	onSelect?: (token: TToken) => void;
}): ReactElement {
	const {safeChainID} = useChainID();
	const {data} = useBalances({tokens: [{address: tokenAddress, chainID: safeChainID}]});
	const token = data[safeChainID]?.[tokenAddress];
	const {data: price} = usePrices({tokens: [token], chainId: safeChainID});

	if (!token) {
		return <IconLoader className={'mt-7 size-4 animate-spin text-neutral-900'} />;
	}

	return (
		<>
			{displayInfo && (
				<div className={'w-full'}>
					<Warning
						message={'Found 1 token that is not present in token list, click it to add'}
						type={'info'}
					/>
				</div>
			)}
			<SmolTokenButton
				token={token}
				isDisabled={false}
				price={price ? price[token.address] : undefined}
				onClick={() => onSelect?.(token)}
			/>
		</>
	);
}
