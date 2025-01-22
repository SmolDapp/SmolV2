'use client';

import {cl} from '@lib/utils/helpers';

import type {InputHTMLAttributes, ReactElement} from 'react';

export function TextTruncate(props: InputHTMLAttributes<HTMLInputElement>): ReactElement {
	const {value, className} = props;
	return (
		<input
			readOnly
			type={'text'}
			className={cl(
				'text-xs w-full border-none p-0 transition-all line-clamp-1 max-w-full truncate disabled bg-transparent text-neutral-600',
				className
			)}
			value={value}
		/>
	);
}
