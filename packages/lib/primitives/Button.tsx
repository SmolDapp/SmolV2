import React, {forwardRef} from 'react';
import {cl} from '@builtbymom/web3/utils';
import {IconSpinner} from '@lib/icons/IconSpinner';

import type {ComponentPropsWithoutRef, ForwardedRef, MouseEvent, ReactElement, ReactNode} from 'react';

type TButtonVariant = 'filled' | 'outlined' | 'light' | 'inherit' | string;

type TButton = {
	children: ReactNode;
	variant?: TButtonVariant;
	shouldStopPropagation?: boolean;
	isBusy?: boolean;
	isDisabled?: boolean;
} & ComponentPropsWithoutRef<'button'>;

type TMouseEvent = MouseEvent<HTMLButtonElement> & MouseEvent<HTMLAnchorElement>;

export const Button = forwardRef((props: TButton, ref: ForwardedRef<HTMLButtonElement | null>): ReactElement => {
	const {
		children,
		variant = 'filled',
		shouldStopPropagation = false,
		isBusy = false,
		isDisabled = false,
		...rest
	} = props;

	return (
		<button
			{...(rest as ComponentPropsWithoutRef<'button'>)}
			ref={ref}
			data-variant={variant}
			className={cl('button', rest.className)}
			aria-busy={isBusy}
			disabled={isDisabled || (rest as ComponentPropsWithoutRef<'button'>).disabled}
			onClick={(event: TMouseEvent): void => {
				if (shouldStopPropagation) {
					event.stopPropagation();
				}
				if (!isBusy && rest.onClick) {
					rest.onClick(event);
				}
			}}>
			{children}
			{isBusy ? (
				<span className={'absolute inset-0 flex items-center justify-center'}>
					<IconSpinner className={'size-6 animate-spin text-neutral-900'} />
				</span>
			) : null}
		</button>
	);
});

Button.displayName = 'Button';
