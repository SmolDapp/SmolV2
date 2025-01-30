'use client';

import {useEffect, useState} from 'react';

import {IconLoader} from '@lib/components/icons/IconLoader';
import {SmolTokenButton} from '@lib/components/SmolTokenButton';
import {Warning} from '@lib/components/Warning';
import {useBalances} from '@lib/contexts/useBalances.multichains';
import {usePrices} from '@lib/contexts/WithPrices/WithPrices';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

export function FetchedTokenButton(props: {
	tokenAddress: TAddress;
	displayInfo?: boolean;
	chainID: number;
	onSelect?: (token: TERC20TokensWithBalance) => void;
}): ReactElement {
	const {data} = useBalances({tokens: [{address: props.tokenAddress, chainID: props.chainID}]});
	const token = data[props.chainID]?.[props.tokenAddress];
	const {getPrice, pricingHash} = usePrices();
	const [price, setPrice] = useState<TNormalizedBN | undefined>(undefined);

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
		setPrice(getPrice(token));
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
