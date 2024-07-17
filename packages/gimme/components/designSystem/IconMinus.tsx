import React from 'react';

import type {ReactElement} from 'react';

export function IconMinus(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'14'}
			height={'2'}
			viewBox={'0 0 14 2'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M1 1.125H13'}
				stroke={'currentColor'}
				strokeWidth={'1.5'}
				strokeLinecap={'round'}
				strokeLinejoin={'round'}
			/>
		</svg>
	);
}
