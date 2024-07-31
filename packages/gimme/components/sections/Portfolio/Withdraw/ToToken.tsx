import {useBalancesModal} from 'packages/gimme/contexts/useBalancesModal';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {IconChevron} from '@lib/icons/IconChevron';

import {useWithdrawFlow} from './useWithdrawFlow';

import type {ReactElement} from 'react';
import type {TToken} from '@builtbymom/web3/types';

export function ToToken(): ReactElement {
	const {configuration, dispatchConfiguration} = useWithdrawFlow();
	const {onOpenCurtain} = useBalancesModal();

	const onSetAssetToReceive = (token: TToken): void => {
		dispatchConfiguration({
			type: 'SET_TOKEN_TO_RECEIVE',
			payload: token
		});
	};

	return (
		<div className={'outline-grey-200 flex w-full items-center justify-between rounded-2xl p-4 outline sm:px-6'}>
			<div className={'text-left'}>
				<p className={'text-grey-800 text-lg'}>{'42,000.69 DAI'}</p>
				<p className={'text-grey-700 text-xs'}>{'$42,000.69'}</p>
			</div>
			<div>
				<button
					className={
						'text-grey-800 bg-grey-100 hover:bg-grey-200 flex items-center gap-2 rounded-2xl p-2 text-lg font-medium transition-colors'
					}
					onClick={() =>
						onOpenCurtain(token => {
							onSetAssetToReceive(token);
						})
					}>
					<ImageWithFallback
						alt={configuration.tokenToReceive?.symbol || 'token'}
						unoptimized
						src={`${process.env.SMOL_ASSETS_URL}/token/${configuration.tokenToReceive?.chainID}/${configuration.tokenToReceive?.address}/logo-128.png`}
						altSrc={`${process.env.SMOL_ASSETS_URL}/token/${configuration.tokenToReceive?.chainID}/${configuration.tokenToReceive?.address}/logo-128.png`}
						quality={90}
						width={32}
						height={32}
					/>
					<p>{configuration.tokenToReceive?.symbol}</p>
					<IconChevron className={'size-6 rotate-90'} />
				</button>
			</div>
		</div>
	);
}
