import React from 'react';

import type {ReactElement} from 'react';

export function IconCross(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				d={
					'M4.47157 3.52827C4.21122 3.26792 3.78911 3.26792 3.52876 3.52827C3.26841 3.78862 3.26841 4.21073 3.52876 4.47108L7.05735 7.99967L3.52876 11.5283C3.26841 11.7886 3.26841 12.2107 3.52876 12.4711C3.78911 12.7314 4.21122 12.7314 4.47157 12.4711L8.00016 8.94248L11.5288 12.4711C11.7891 12.7314 12.2112 12.7314 12.4716 12.4711C12.7319 12.2107 12.7319 11.7886 12.4716 11.5283L8.94297 7.99967L12.4716 4.47108C12.7319 4.21073 12.7319 3.78862 12.4716 3.52827C12.2112 3.26792 11.7891 3.26792 11.5288 3.52827L8.00016 7.05687L4.47157 3.52827Z'
				}
				fill={'currentColor'}
			/>
		</svg>
	);
}
