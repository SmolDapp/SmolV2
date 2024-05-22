import React from 'react';

import type {ReactElement} from 'react';

export function IconUpload(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'24'}
			height={'24'}
			viewBox={'0 0 24 24'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M8 17L12 13L16 17'}
				stroke={'black'}
				stroke-width={'2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
			<path
				d={'M12 13V23'}
				stroke={'black'}
				stroke-width={'2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
			<path
				d={'M8 23H5C3.896 23 3 22.104 3 21V3C3 1.896 3.896 1 5 1H14L21 8V21C21 22.104 20.104 23 19 23H16'}
				stroke={'black'}
				stroke-width={'2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
		</svg>
	);
}
