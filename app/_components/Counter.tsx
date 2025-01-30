'use client';

import {animate} from 'framer-motion';
import {useLayoutEffect, useRef, useState} from 'react';

import {cl} from '@lib/utils/helpers';
import {formatAmount, parseAmount} from '@lib/utils/numbers';

import type {MutableRefObject, ReactElement} from 'react';

export function Counter({
	value,
	decimals = 18,
	idealDecimals,
	decimalsToDisplay,
	className,
	decimalsClassName,
	shouldBeStylized,
	shouldDustify
}: {
	value: number; // Value to animate
	decimals: number; // Number of decimals of that token
	idealDecimals?: number; // Ideal decimals to display
	decimalsToDisplay?: number[]; // Decimals to display
	className?: string;
	decimalsClassName?: string;
	shouldBeStylized?: boolean; // Whether the counter should be stylized
	shouldDustify?: boolean; // Whether the counter should dustify
}): ReactElement {
	const nodeRef = useRef<HTMLSpanElement | undefined>(undefined);
	const valueRef = useRef(value || 0);
	const [innerContent, setInnerContent] = useState<ReactElement | undefined>(undefined);

	useLayoutEffect((): (() => void) => {
		const node = nodeRef.current;
		if (node) {
			const controls = animate(Number(valueRef.current || 0), value, {
				duration: 1,
				onUpdate(value) {
					let finalValue = '0.00';
					let hasBeenSet = false;
					valueRef.current = value;
					if (Number.isNaN(value) || value === 0) {
						const formatedValue = formatAmount(0, idealDecimals, idealDecimals);
						finalValue = formatedValue;
					} else if (decimalsToDisplay && decimalsToDisplay.length > 0) {
						const allDecimalsToTests = [...decimalsToDisplay, decimals];

						if (idealDecimals) {
							allDecimalsToTests.unshift(idealDecimals);
						}
						for (const decimalToDisplay of allDecimalsToTests) {
							if (decimalToDisplay > decimals) {
								const formatedValue = formatAmount(value.toFixed(decimals), decimals, decimals);
								finalValue = formatedValue;
								hasBeenSet = true;
								break;
							}
							const formatedValue = formatAmount(
								value.toFixed(decimals),
								decimalToDisplay,
								decimalToDisplay
							);
							if (
								Number.isNaN(parseAmount(formatedValue)) ||
								formatedValue === 'NaN' ||
								parseAmount(formatedValue) === 0
							) {
								continue;
							}
							finalValue = formatedValue;
							hasBeenSet = true;
							break;
						}
						if (!hasBeenSet) {
							if (Number.isNaN(value) || value === 0) {
								const formatedValue = formatAmount(0, idealDecimals, idealDecimals);
								finalValue = formatedValue;
							} else {
								const formatedValue = formatAmount(value.toFixed(decimals), decimals, decimals);
								finalValue = formatedValue;
							}
						}
					} else {
						const formatedValue = formatAmount(
							value.toFixed(decimals),
							decimals || idealDecimals,
							decimals || idealDecimals
						);
						finalValue = formatedValue;
					}

					if (shouldBeStylized) {
						const parts = finalValue.split('.');
						setInnerContent(
							<span>
								{parts[0]}
								<span className={cl('text-neutral-400', decimalsClassName)}>
									{'.'}
									{parts[1]}
								</span>
							</span>
						);
					} else {
						if (Number(finalValue) === 0 && Number(valueRef.current) !== 0 && shouldDustify) {
							node.textContent = '< 0.0000';
						} else {
							node.textContent = finalValue;
						}
					}
				}
			});
			return () => controls.stop();
		}
		return () => undefined;
	}, [value, decimals, decimalsToDisplay, idealDecimals, shouldBeStylized, decimalsClassName, shouldDustify]);

	return (
		<span
			className={className}
			suppressHydrationWarning
			ref={nodeRef as MutableRefObject<HTMLSpanElement>}
			children={innerContent}
		/>
	);
}
