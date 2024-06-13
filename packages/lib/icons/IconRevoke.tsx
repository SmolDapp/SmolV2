import React from 'react';

import type {ReactElement} from 'react';

function IconRevoke(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'16'}
			height={'16'}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={'M13.9999 1.99978L10.1818 1.99978L10.1818 6'}
				stroke={'#ADB1BD'}
				stroke-width={'1.2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
			<path
				d={
					'M6.90909 2.09873C4.11636 2.612 2 5.05891 2 8C2 11.3136 4.68636 14 8 14C11.3136 14 14 11.3136 14 8C14 5.57927 12.5671 3.494 10.5025 2.54545'
				}
				stroke={'#ADB1BD'}
				stroke-width={'1.2'}
				stroke-linecap={'round'}
				stroke-linejoin={'round'}
			/>
		</svg>
	);
}

export {IconRevoke};
