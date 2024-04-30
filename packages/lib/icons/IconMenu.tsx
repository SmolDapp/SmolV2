import React from 'react';

import type {ReactElement} from 'react';

function IconMenu(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 448 512'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				fill={'currentColor'}
				d={
					'M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H424c13.3 0 24 10.7 24 24z'
				}
			/>
		</svg>
	);
}

export {IconMenu};
