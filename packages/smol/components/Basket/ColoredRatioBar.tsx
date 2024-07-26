import React, {useState} from 'react';
import {usePalette} from 'react-palette';
import {useTimeout} from 'usehooks-ts';

import type {ReactElement} from 'react';

export function ColoredRatioBar({logoURI, share}: {logoURI: string; share: number}): ReactElement {
	const {data} = usePalette(logoURI.replace('128.png', '32.png'));
	const [width, set_width] = useState(0);

	useTimeout(() => {
		set_width(share);
	}, 1000);

	return (
		<div
			className={'h-full rounded-lg border border-neutral-200 bg-neutral-200 transition-all duration-700'}
			style={{width: `${width}%`, backgroundColor: data.vibrant}}
		/>
	);
}
