'use client';

import {Content} from '@radix-ui/react-dialog';

import {cl} from '@lib/utils/helpers';

import type {DialogContentProps} from '@radix-ui/react-dialog';
import type {ReactElement} from 'react';

export const CurtainContent = (props: DialogContentProps): ReactElement => {
	const {className, children, ...rest} = props;
	return (
		<>
			<Content
				onPointerDownOutside={e => {
					const target = e.target as HTMLElement;
					if (target.id == 'backdrop' || target.id == 'backdrop-content') {
						e.preventDefault();
						e.stopPropagation();
					}
				}}
				{...rest}
				tabIndex={-1}
				className={cl(
					'absolute z-50 transition ease inset-y-0 h-full right-0 w-full max-w-108',
					'data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=open]:slide-in-from-right',
					'data-[state=closed]:slide-out-to-right data-[state=closed]:animate-out data-[state=closed]:duration-300',
					className
				)}>
				{children}
			</Content>
		</>
	);
};
