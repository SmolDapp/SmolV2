import {type ReactElement, useEffect, useState} from 'react';
import {useBalances} from '@builtbymom/web3/hooks/useBalances.multichains';
import {Warning} from '@lib/common/Warning';
import {usePrices} from '@lib/contexts/usePrices';
import {IconLoader} from '@lib/icons/IconLoader';

import {SmolTokenButton} from './SmolTokenButton';

import type {TAddress, TNormalizedBN, TToken} from '@builtbymom/web3/types';

export function FetchedTokenButton(props: {
	tokenAddress: TAddress;
	displayInfo?: boolean;
	chainID: number;
	onSelect?: (token: TToken) => void;
}): ReactElement {
	const {data} = useBalances({tokens: [{address: props.tokenAddress, chainID: props.chainID}]});
	const token = data[props.chainID]?.[props.tokenAddress];
	const {getPrice, pricingHash} = usePrices();
	const [price, set_price] = useState<TNormalizedBN | undefined>(undefined);

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token changes, indicating that we need
	 ** to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!token) {
			return;
		}
		set_price(getPrice(token));
	}, [token, pricingHash, getPrice]);

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
				price={price}
				onClick={() => props.onSelect?.(token)}
			/>
		</>
	);
}
