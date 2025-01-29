'use client';

import {cl, handleLowAmount} from '@lib/utils/helpers';
import {formatAmount, formatCounterValue, percentOf, zeroNormalizedBN} from '@lib/utils/numbers';
import {useDeepCompareEffect, useUpdateEffect} from '@react-hookz/web';
import InputNumber from 'rc-input-number';
import React, {useCallback, useEffect, useState} from 'react';
import {useChainId} from 'wagmi';

import {usePrices} from '@smolContexts/WithPrices/WithPrices';
import {useValidateAmountInput} from '@smolHooks/web3/useValidateAmountInput';
import {TextTruncate} from 'packages/smol/common/TextTruncate';

import {SmolTokenSelectorButton} from './SmolTokenSelectorButton';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

/**************************************************************************************************
 ** The TTokenAmountInputElement type definition is used in the SmolTokenAmountInput component
 ** and define the different properties that are used to represent a token amount input element.
 ** The properties are:
 ** - amount: string - Represents what the user inputed
 ** - value?: number - Represents the value of the input element
 ** - normalizedBigAmount: TNormalizedBN - Represents the normalized amount, used for calculations
 ** - token: TERC20TokensWithBalance | undefined - Represents the token that the user selected
 ** - status: 'pending' | 'success' | 'error' | 'none' - Represents the status of the input element
 ** - isValid: boolean | 'undetermined' - Represents if the input is valid
 ** - error?: string | undefined - Represents the error message if the input is invalid
 ** - UUID: string - Represents the unique identifier of the input element
 *************************************************************************************************/
export type TTokenAmountInputElement = {
	amount: string;
	value?: number;
	normalizedBigAmount: TNormalizedBN;
	token: TERC20TokensWithBalance | undefined;
	status: 'pending' | 'success' | 'error' | 'none';
	isValid: boolean | 'undetermined';
	error?: string | undefined;
	UUID: string;
};

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
	const chainID = useChainId();
	const {getPrice, pricingHash} = usePrices();
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [price, setPrice] = useState<TNormalizedBN | undefined>(undefined);
	const {result, validate} = useValidateAmountInput();
	const {token: selectedToken} = value;
	const [selectedTokenBalance, setSelectedTokenBalance] = useState<TNormalizedBN>(
		selectedToken?.balance ?? zeroNormalizedBN
	);

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token changes, indicating that we need
	 ** to update the balance for the current token.
	 *********************************************************************************************/
	useEffect(() => {
		if (selectedToken) {
			setSelectedTokenBalance(selectedToken.balance);
		}
	}, [selectedToken]);

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token, chainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!selectedToken) {
			return;
		}
		setPrice(getPrice(selectedToken));
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
			return 'border-neutral-600';
		}
		if (value.isValid === false) {
			return 'border-red';
		}
		return 'border-neutral-400';
	}, [isFocused, value.isValid]);

	const getErrorOrButton = (): ReactElement => {
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
					: price
						? formatCounterValue(value.normalizedBigAmount.normalized, price.normalized)
						: 'N/A'}
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
	}, [chainID, chainIDToUse]);

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
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
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
