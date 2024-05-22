import {type ReactElement} from 'react';
import {useBalances} from '@builtbymom/web3/hooks/useBalances.multichains';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {Warning} from '@lib/common/Warning';
import {IconLoader} from '@lib/icons/IconLoader';

import {SmolTokenButton} from './SmolTokenButton';

import type {TAddress, TToken} from '@builtbymom/web3/types';

export function FetchedTokenButton(props: {
	tokenAddress: TAddress;
	displayInfo?: boolean;
	chainID: number;
	onSelect?: (token: TToken) => void;
}): ReactElement {
	const {data} = useBalances({tokens: [{address: props.tokenAddress, chainID: props.chainID}]});
	const token = data[props.chainID]?.[props.tokenAddress];
	const {data: price} = usePrices({tokens: [token], chainId: props.chainID});

	if (!token) {
		return <IconLoader className={'mt-7 size-4 animate-spin text-neutral-900'} />;
	}

	return (
		<>
			{props.displayInfo && (
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
				onClick={() => props.onSelect?.(token)}
			/>
		</>
	);
}
