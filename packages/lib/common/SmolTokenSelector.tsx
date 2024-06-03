import {useCallback, useState} from 'react';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl} from '@builtbymom/web3/utils';
import {useUpdateEffect} from '@react-hookz/web';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';

import type {TToken} from '@builtbymom/web3/types';

export function SmolTokenSelector(props: {
	onSelectToken: (token: TToken | undefined) => void;
	token: TToken | undefined;
}): JSX.Element {
	const {safeChainID} = useChainID();
	const [isFocused] = useState<boolean>(false);
	const {onOpenCurtain} = useBalancesCurtain();
	const {data: price} = usePrices({tokens: props.token ? [props.token] : [], chainId: safeChainID});

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
					price={price && props.token?.address ? price[props.token?.address] : undefined}
					displayChevron
				/>
			</div>
		</div>
	);
}
