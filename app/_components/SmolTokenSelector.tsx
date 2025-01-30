'use client';

import {useUpdateEffect} from '@react-hookz/web';
import {useCallback, useEffect, useState} from 'react';
import {useChainId} from 'wagmi';

import {SmolTokenButton} from '@lib/components/SmolTokenButton';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {usePrices} from '@lib/contexts/WithPrices/WithPrices';
import {cl} from '@lib/utils/helpers';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

export function SmolTokenSelector(props: {
	onSelectToken: (token: TERC20TokensWithBalance | undefined) => void;
	token: TERC20TokensWithBalance | undefined;
}): ReactElement {
	const chainID = useChainId();
	const [isFocused] = useState<boolean>(false);
	const {onOpenCurtain} = useBalancesCurtain();
	const [price, setPrice] = useState<TNormalizedBN | undefined>(undefined);
	const {getPrice, pricingHash} = usePrices();

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token, chainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!props.token) {
			return;
		}
		setPrice(getPrice(props.token));
	}, [props.token, pricingHash, getPrice]);

	const getBorderColor = useCallback((): string => {
		if (isFocused) {
			return 'border-neutral-600';
		}

		return 'border-neutral-400';
	}, [isFocused]);

	/* Remove selected token on network change */
	useUpdateEffect(() => {
		if (props.token && props.token?.chainID !== chainID) {
			props.onSelectToken(undefined);
		}
	}, [chainID]);

	return (
		<div className={'relative size-full'}>
			<div
				className={cl(
					'h-20 z-20 relative border transition-all',
					'flex flex-row items-center cursor-text',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'p-2 group bg-neutral-0 rounded-lg',
					getBorderColor()
				)}>
				<SmolTokenButton
					onClick={() => {
						onOpenCurtain(token => props.onSelectToken(token), {
							chainID: chainID,
							withTabs: true
						});
					}}
					token={props.token}
					price={price}
					displayChevron
				/>
			</div>
		</div>
	);
}
