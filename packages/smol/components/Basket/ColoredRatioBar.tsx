import React from 'react';
import {usePalette} from 'react-palette';

import type {ReactElement} from 'react';

export function ColoredRatioBar({logoURI, share}: {logoURI: string; share: number}): ReactElement {
	const {data} = usePalette(logoURI.replace('128.png', '32.png') || '');

	return (
		<div
			className={'h-full rounded-lg border border-neutral-200 bg-neutral-200 transition-colors'}
			style={{width: `${share}%`, backgroundColor: data.vibrant}}
		/>
	);
}
