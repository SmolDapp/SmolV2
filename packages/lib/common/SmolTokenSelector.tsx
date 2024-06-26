import {useCallback, useEffect, useState} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl} from '@builtbymom/web3/utils';
import {useUpdateEffect} from '@react-hookz/web';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {usePrices} from '@lib/contexts/usePrices';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

export function SmolTokenSelector(props: {
	onSelectToken: (token: TToken | undefined) => void;
	token: TToken | undefined;
}): JSX.Element {
	const {safeChainID} = useChainID();
	const [isFocused] = useState<boolean>(false);
	const {onOpenCurtain} = useBalancesCurtain();
	const [price, set_price] = useState<TNormalizedBN | undefined>(undefined);
	const {getPrice, pricingHash} = usePrices();

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token, safeChainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!props.token) {
			return;
		}
		set_price(getPrice(props.token));
	}, [props.token, pricingHash, getPrice]);

	const getBorderColor = useCallback((): string => {
		if (isFocused) {
			return 'border-neutral-600';
		}

		return 'border-neutral-400';
	}, [isFocused]);

	/* Remove selected token on network change */
	useUpdateEffect(() => {
		props.onSelectToken(undefined);
	}, [safeChainID]);

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
							chainID: safeChainID,
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
