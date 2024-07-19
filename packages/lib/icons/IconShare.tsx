import React from 'react';

import type {ReactElement} from 'react';

export function IconShare(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 12 12'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M5 1L11 1V7'}
				stroke={'#2A5A7E'}
				stroke-width={'2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
			<path
				d={'M11 1L1 11'}
				stroke={'#2A5A7E'}
				stroke-width={'2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
		</svg>
	);
}
