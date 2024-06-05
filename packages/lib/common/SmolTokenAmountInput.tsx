import React, {useCallback, useEffect, useState} from 'react';
import InputNumber from 'rc-input-number';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, formatAmount, formatCounterValue, percentOf, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useDeepCompareEffect, useUpdateEffect} from '@react-hookz/web';
import {getNewInput} from '@smolSections/Send/useSendFlow';
import {TextTruncate} from '@lib/common/TextTruncate';
import {useValidateAmountInput} from '@lib/hooks/useValidateAmountInput';
import {handleLowAmount} from '@lib/utils/helpers';

import {SmolTokenSelectorButton} from './SmolTokenSelectorButton';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/Inputs';

export const defaultTokenInputLike: TTokenAmountInputElement = getNewInput();

type TTokenAmountInput = {
	onSetValue: (value: Partial<TTokenAmountInputElement>) => void;
	value: TTokenAmountInputElement;
	chainIDToUse?: number;
	showPercentButtons?: boolean;
	displayNetworkIcon?: boolean;
};

const percentIntervals = [25, 50, 75];

export function SmolTokenAmountInput({
	onSetValue,
	value,
	showPercentButtons = false,
	displayNetworkIcon = false,
	chainIDToUse
}: TTokenAmountInput): ReactElement {
	const {safeChainID} = useChainID();
	const [isFocused, set_isFocused] = useState<boolean>(false);
	const {token: selectedToken} = value;
	const [selectedTokenBalance, set_selectedTokenBalance] = useState<TNormalizedBN>(
		selectedToken?.balance ?? zeroNormalizedBN
	);

	const {result, validate} = useValidateAmountInput();
	const {data: prices} = usePrices({
		tokens: selectedToken ? [selectedToken] : [],
		chainId: chainIDToUse || safeChainID
	});
	const price = prices && selectedToken ? prices[selectedToken.address] : undefined;

	useEffect(() => {
		if (selectedToken) {
			set_selectedTokenBalance(selectedToken.balance);
		}
	}, [selectedToken]);

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
			return 'border-neutral-600';
		}
		if (value.isValid === false) {
			return 'border-red';
		}
		return 'border-neutral-400';
	}, [isFocused, value.isValid]);

	const getErrorOrButton = (): JSX.Element => {
		if (showPercentButtons) {
			return (
				<div className={'flex gap-1 '}>
					{percentIntervals.map(percent => (
						<button
							className={'rounded-full bg-neutral-200 px-2 py-0.5 transition-colors hover:bg-neutral-300'}
							onClick={() => onSetFractional(percent)}
							onMouseDown={e => e.preventDefault()}>
							{percent}
							{'%'}
						</button>
					))}
				</div>
			);
		}

		if (!selectedToken?.address) {
			return <TextTruncate value={'No token selected'} />;
		}

		if (!value.amount) {
			return (
				<button
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
			<p>
				{value.value
					? `$${formatAmount(value.value, 2)}`
					: formatCounterValue(value.normalizedBigAmount.normalized, price?.normalized ?? 0)}
			</p>
		);
	};

	useDeepCompareEffect(() => {
		if (!result) {
			return;
		}
		onSetValue(result);
	}, [result]);

	/**********************************************************************************************
	 ** Remove selected token on network change, unless we are specifically setting the chainID via
	 ** the chainIDToUse prop.
	 *********************************************************************************************/
	useUpdateEffect(() => {
		if (chainIDToUse === undefined) {
			validate(value.amount, undefined);
		}
	}, [safeChainID, chainIDToUse]);

	return (
		<div className={'relative size-full rounded-lg'}>
			<label
				className={cl(
					'z-20 relative border transition-all h-20',
					'flex flex-grow-0 items-center cursor-text',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'p-2 pl-4 group bg-neutral-0 rounded-lg',
					getBorderColor()
				)}>
				<div className={'relative w-full pr-2'}>
					<InputNumber
						prefixCls={cl(
							'w-full border-none bg-transparent p-0 text-xl transition-all',
							'text-neutral-900 placeholder:text-neutral-400 focus:placeholder:text-neutral-400/30',
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
					<div className={'flex items-center justify-between text-xs text-[#ADB1BD]'}>
						{getErrorOrButton()}
						<button
							className={
								'rounded-md px-2 py-1 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40'
							}
							onClick={onSetMax}
							onMouseDown={e => e.preventDefault()}
							disabled={!selectedToken || selectedTokenBalance.raw === 0n}>
							{'MAX'}
						</button>
					</div>
				</div>
				<div className={'w-full max-w-[176px]'}>
					<SmolTokenSelectorButton
						onSelectToken={token => {
							/**********************************************************************
							 * Super specific case processing:
							 * 1. Change token from the outside of the component (e.g set token to
							 * undefined)
							 * 2. Select previously changed token again
							 * 3. Previous 'result' object (with defined token) and new 'result'
							 * are deeply equal to each other therefore line 129 useEffect that
							 * sets the value is not triggered
							 *
							 * This small condition helps to proceed with externally changed tokens
							 **********************************************************************/
							if (token.address === result?.token?.address) {
								return onSetValue(result);
							}

							validate(value.amount, token, token.balance);
						}}
						displayNetworkIcon={displayNetworkIcon}
						token={selectedToken}
						chainID={chainIDToUse}
					/>
				</div>
			</label>
		</div>
	);
}
