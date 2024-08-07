import {type ReactElement, useCallback} from 'react';
import {useBalancesModal} from 'packages/gimme/contexts/useBalancesModal';
import {useWithdrawSolver} from 'packages/gimme/contexts/useWithdrawSolver';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {formatCounterValue, formatTAmount, toBigInt, toNormalizedValue} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {usePrices} from '@lib/contexts/usePrices';
import {IconChevron} from '@lib/icons/IconChevron';

import {useWithdrawFlow} from './useWithdrawFlow';

import type {TToken} from '@builtbymom/web3/types';

export function ToToken(): ReactElement {
	const {configuration, dispatchConfiguration} = useWithdrawFlow();
	const {onOpenCurtain} = useBalancesModal();
	const {quote, isFetchingQuote} = useWithdrawSolver();
	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.tokenToReceive?.address);
	const {getPrice} = usePrices();

	const onSetAssetToReceive = (token: TToken): void => {
		dispatchConfiguration({
			type: 'SET_TOKEN_TO_RECEIVE',
			payload: token
		});
	};

	const getReceivingAmount = useCallback(() => {
		if (!isZapNeeded) {
			return (
				<p className={'text-grey-800 text-lg'}>
					{formatTAmount({
						value: configuration.asset.normalizedBigAmount.raw,
						decimals: configuration.asset.token?.decimals || 18
					})}{' '}
					{configuration.asset.token?.symbol}
				</p>
			);
		}

		if (isFetchingQuote || !quote) {
			return (
				<div className={'flex h-8 w-28 flex-col justify-center'}>
					<div className={'skeleton-lg h-4 w-full'} />
				</div>
			);
		}

		return (
			<p className={'text-grey-800 text-lg'}>
				{formatTAmount({
					value: toBigInt(quote?.outputAmount),
					decimals: +quote?.outputTokenDecimals
				})}{' '}
				{configuration.tokenToReceive?.symbol}
			</p>
		);
	}, [
		configuration.asset.normalizedBigAmount.raw,
		configuration.asset.token?.decimals,
		configuration.asset.token?.symbol,
		configuration.tokenToReceive?.symbol,
		isFetchingQuote,
		isZapNeeded,
		quote
	]);

	const getFiatReceivingValue = useCallback(() => {
		const receivingTokenPrice = configuration.tokenToReceive
			? getPrice(configuration.tokenToReceive)?.normalized || 0
			: 0;

		if (!isZapNeeded) {
			return (
				<p className={'text-grey-700 text-xs'}>
					{formatCounterValue(configuration.asset.normalizedBigAmount.normalized, receivingTokenPrice)}
				</p>
			);
		}

		if (isFetchingQuote || !quote) {
			return (
				<div className={'flex h-4 w-10 flex-col justify-center'}>
					<div className={'skeleton-lg h-3 w-full'} />
				</div>
			);
		}

		return (
			<p className={'text-grey-700 text-xs'}>
				{formatCounterValue(
					toNormalizedValue(toBigInt(quote.outputAmount), quote.outputTokenDecimals),
					receivingTokenPrice
				)}
			</p>
		);
	}, [
		configuration.asset.normalizedBigAmount.normalized,
		configuration.tokenToReceive,
		getPrice,
		isFetchingQuote,
		isZapNeeded,
		quote
	]);

	return (
		<div className={'outline-grey-200 flex w-full items-center justify-between rounded-2xl p-4 outline sm:px-6'}>
			<div className={'text-left'}>
				{getReceivingAmount()}
				{getFiatReceivingValue()}
			</div>
			<div>
				<button
					className={
						'text-grey-800 bg-grey-100 hover:bg-grey-200 flex items-center gap-2 rounded-2xl p-2 text-lg font-medium transition-colors'
					}
					onClick={() =>
						onOpenCurtain(token => onSetAssetToReceive(token), {
							chainID: configuration.asset.token?.chainID,
							shouldBypassBalanceCheck: true,
							highlightedTokens: [configuration.asset.token as TToken]
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
