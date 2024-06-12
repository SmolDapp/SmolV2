import {useLayoutEffect, useRef, useState} from 'react';
import {animate} from 'framer-motion';
import {formatAmount, parseAmount} from '@builtbymom/web3/utils';

import type {MutableRefObject, ReactElement} from 'react';

export function Counter({
	value,
	decimals = 18,
	idealDecimals,
	decimalsToDisplay,
	className,
	shouldBeStylized
}: {
	value: number; // Value to animate
	decimals: number; // Number of decimals of that token
	idealDecimals?: number; // Ideal decimals to display
	decimalsToDisplay?: number[]; // Decimals to display
	className?: string;
	shouldBeStylized?: boolean; // Whether the counter should be stylized
}): ReactElement {
	const nodeRef = useRef() as MutableRefObject<HTMLSpanElement | undefined>;
	const valueRef = useRef(value || 0);
	const [innerContent, set_innerContent] = useState<ReactElement | undefined>(undefined);

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
						set_innerContent(
							<span>
								{parts[0]}
								<span className={'text-neutral-400'}>
									{'.'}
									{parts[1]}
								</span>
							</span>
						);
					} else {
						node.textContent = finalValue;
					}
				}
			});
			return () => controls.stop();
		}
		return () => undefined;
	}, [value, decimals, decimalsToDisplay, idealDecimals, shouldBeStylized]);

	return (
		<span
			className={className}
			suppressHydrationWarning
			ref={nodeRef as MutableRefObject<HTMLSpanElement>}
			children={innerContent}
		/>
	);
}
