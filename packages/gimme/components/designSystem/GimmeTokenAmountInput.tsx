import React, {useCallback, useEffect, useMemo, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, formatAmount, formatCounterValue, percentOf, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useDeepCompareEffect, useUpdateEffect} from '@react-hookz/web';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {TextTruncate} from '@lib/common/TextTruncate';
import {useBalancesCurtain} from '@lib/contexts/useBalancesCurtain';
import {usePrices} from '@lib/contexts/usePrices';
import {useValidateAmountInput} from '@lib/hooks/useValidateAmountInput';
import {IconChevron} from '@lib/icons/IconChevron';
import {handleLowAmount} from '@lib/utils/helpers';

import type {ReactElement} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';

type TTokenAmountInput = {
	onSetValue: (value: Partial<TTokenAmountInputElement>) => void;
	onSelectTokenCallback: (token: TToken) => void;
	value: TTokenAmountInputElement;
};

const percentIntervals = [10, 50, 100];

export function GimmeTokenAmountInput({onSetValue, value, onSelectTokenCallback}: TTokenAmountInput): ReactElement {
	const {onOpenCurtain} = useBalancesCurtain();

	const {safeChainID} = useChainID();

	const {getPrice, pricingHash} = usePrices();
	const {getToken} = useTokenList();

	const [isFocused, set_isFocused] = useState<boolean>(false);
	const [price, set_price] = useState<TNormalizedBN | undefined>(undefined);
	const {result, validate} = useValidateAmountInput();
	const {token: selectedToken} = value;
	const [selectedTokenBalance, set_selectedTokenBalance] = useState<TNormalizedBN>(
		selectedToken?.balance ?? zeroNormalizedBN
	);

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token changes, indicating that we need
	 ** to update the balance for the current token.
	 *********************************************************************************************/
	useEffect(() => {
		if (selectedToken) {
			set_selectedTokenBalance(selectedToken.balance);
		}
	}, [selectedToken]);

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token, safeChainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!selectedToken) {
			return;
		}
		set_price(getPrice(selectedToken));
	}, [selectedToken, pricingHash, getPrice]);

	const onSetMax = (): void => {
		return onSetValue({
			amount: selectedTokenBalance.display,
			normalizedBigAmount: selectedTokenBalance,
			isValid: true,
			error: undefined
		});
	};

	const onSetFractional = (percentage: number): void => {
		const calculatedPercent = percentOf(+selectedTokenBalance.normalized, percentage);
		validate(calculatedPercent.toString(), selectedToken);
	};

	const getBorderColor = useCallback((): string => {
		if (isFocused) {
			return 'border-grey-300';
		}
		if (value.isValid === false) {
			return 'border-red';
		}
		return 'border-transparent';
	}, [isFocused, value.isValid]);

	const getErrorOrButton = (): JSX.Element => {
		if (!selectedToken?.address) {
			return (
				<TextTruncate
					className={'!text-grey-700'}
					value={'No token selected'}
				/>
			);
		}

		if (!value.amount) {
			return (
				<button
					className={'text-grey-700'}
					onClick={onSetMax}
					onMouseDown={e => e.preventDefault()}
					disabled={!selectedToken || selectedTokenBalance.raw === 0n}>
					<p>{`You have ${handleLowAmount(selectedTokenBalance, 2, 6)}`}</p>
				</button>
			);
		}

		if (value.error) {
			return (
				<TextTruncate
					className={'text-red'}
					value={value.error}
				/>
			);
		}

		return (
			<p className={'text-grey-700'}>
				{value.value
					? `$${formatAmount(value.value, 2)}`
					: price
						? formatCounterValue(value.normalizedBigAmount.normalized, price.normalized)
						: 'N/A'}
			</p>
		);
	};

	/**********************************************************************************************
	 ** The tokenIcon memoized value contains the URL of the token icon. Based on the provided
	 ** information and what we have in the token list, we will try to find the correct icon source
	 *********************************************************************************************/
	const tokenIcon = useMemo(() => {
		if (!selectedToken) {
			return undefined;
		}
		if (selectedToken?.logoURI) {
			return selectedToken.logoURI;
		}
		const tokenFromList = getToken({chainID: selectedToken.chainID, address: selectedToken.address});

		if (tokenFromList?.logoURI) {
			return tokenFromList.logoURI;
		}
		return `${process.env.SMOL_ASSETS_URL}/token/${selectedToken.chainID}/${selectedToken.address}/logo-128.png`;
	}, [getToken, selectedToken]);

	useDeepCompareEffect(() => {
		if (!result) {
			return;
		}
		onSetValue(result);
	}, [result]);

	/**********************************************************************************************
	 ** Remove selected token on network change,
	 *********************************************************************************************/
	useUpdateEffect(() => {
		validate(value.amount, undefined);
	}, [safeChainID]);

	return (
		<div className={'relative size-full rounded-lg'}>
			<label
				className={cl(
					'z-20 relative border transition-all h-[120px]',
					'flex flex-col flex-grow-0 cursor-text justify-between',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'py-4 px-6 bg-grey-100 rounded-2xl',
					getBorderColor()
				)}>
				<div className={'flex items-center gap-2'}>
					<p className={'text-grey-800 text-xs font-medium'}>{'Asset'}</p>
					{selectedToken && (
						<div className={'flex items-center gap-0.5'}>
							{percentIntervals.map(percent => (
								<button
									className={
										'text-grey-800 border-grey-200 rounded-full border bg-white px-2 py-0.5 text-xs transition-colors'
									}
									onClick={() => onSetFractional(percent)}
									onMouseDown={e => e.preventDefault()}>
									{percent === 100 ? 'MAX' : percent}
									{percent === 100 ? '' : '%'}
								</button>
							))}
						</div>
					)}
				</div>
				<div>
					<div className={'flex justify-between'}>
						<div className={'flex gap-2'}>
							{selectedToken && (
								<ImageWithFallback
									className={'mt-1'}
									alt={selectedToken?.symbol || 'token'}
									unoptimized
									src={tokenIcon || ''}
									altSrc={`${process.env.SMOL_ASSETS_URL}/token/${selectedToken?.chainID}/${selectedToken?.address}/logo-128.png`}
									quality={90}
									width={32}
									height={32}
								/>
							)}
							<div className={'flex flex-col'}>
								<div className={'flex gap-1'}>
									<InputNumber
										prefixCls={cl(
											// inputWidth,
											'w-full border-none bg-transparent p-0 text-3xl transition-all',
											'text-grey-800 placeholder:text-grey-700 focus:placeholder:text-grey-400/30',
											'placeholder:transition-colors overflow-hidden'
										)}
										placeholder={'0.00'}
										value={value.amount}
										onChange={value => validate(value || '', selectedToken)}
										decimalSeparator={'.'}
										onFocus={() => set_isFocused(true)}
										onBlur={() => set_isFocused(false)}
										min={'0'}
										step={0.1}
									/>
								</div>
								<div className={'ml-0.5 text-xs'}>{getErrorOrButton()}</div>
							</div>
						</div>
						<div className={''}>
							{selectedToken ? (
								<button
									className={'hover:bg-grey-200 rounded-full p-2 transition-colors'}
									onClick={() =>
										onOpenCurtain(token => {
											onSelectTokenCallback(token);
											validate(value.amount, token, token.balance);
										})
									}>
									<IconChevron className={'text-grey-800 size-6 min-w-4'} />
								</button>
							) : (
								<div>
									<button
										className={
											'bg-primary hover:bg-primaryHover flex w-[102px] items-center justify-between rounded-2xl py-2 pl-4 pr-2'
										}
										onClick={() =>
											onOpenCurtain(token => validate(value.amount, token, token.balance))
										}>
										{'Select'}
										<IconChevron className={'size-6 min-w-4'} />
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</label>
		</div>
	);
}
