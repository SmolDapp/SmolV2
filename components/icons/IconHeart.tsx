import React from 'react';

import type {ReactElement} from 'react';

export function IconHeart(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={
					'M1.92595 3.39372C2.5691 2.54834 3.53932 2 4.79167 2C6.32556 2 7.2921 2.69952 8 3.37911C8.7079 2.69952 9.67444 2 11.2083 2C12.4607 2 13.4309 2.54834 14.0741 3.39372C14.7047 4.22271 15 5.30603 15 6.38C15 8.25243 13.9304 9.88552 12.6077 11.1481C11.2756 12.4196 9.60589 13.3959 8.21325 13.9585C8.07618 14.0138 7.92382 14.0138 7.78675 13.9585C6.39411 13.3959 4.72441 12.4196 3.39234 11.1481C2.06956 9.88552 1 8.25243 1 6.38C1 5.30603 1.29526 4.22271 1.92595 3.39372ZM2.84474 4.13323C2.40603 4.70989 2.16667 5.51657 2.16667 6.38C2.16667 7.76977 2.96873 9.10668 4.18593 10.2685C5.32751 11.3582 6.76447 12.2242 8 12.7528C9.23552 12.2242 10.6725 11.3582 11.8141 10.2685C13.0313 9.10668 13.8333 7.76977 13.8333 6.38C13.8333 5.51657 13.594 4.70989 13.1553 4.13323C12.729 3.57296 12.0951 3.2 11.2083 3.2C9.85669 3.2 9.12628 3.89948 8.41543 4.64121C8.3058 4.7556 8.15616 4.82 8 4.82C7.84384 4.82 7.6942 4.7556 7.58457 4.64121C6.87372 3.89948 6.14331 3.2 4.79167 3.2C3.90493 3.2 3.27099 3.57296 2.84474 4.13323Z'
				}
				fill={'currentcolor'}
			/>
		</svg>
	);
}

export function IconHeartFilled(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			viewBox={'0 0 16 16'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={
					'M1.92595 3.39372C2.5691 2.54834 3.53932 2 4.79167 2C6.32556 2 7.2921 2.69952 8 3.37911C8.7079 2.69952 9.67444 2 11.2083 2C12.4607 2 13.4309 2.54834 14.0741 3.39372C14.7047 4.22271 15 5.30603 15 6.38C15 8.25243 13.9304 9.88552 12.6077 11.1481C11.2756 12.4196 9.60589 13.3959 8.21325 13.9585C8.07618 14.0138 7.92382 14.0138 7.78675 13.9585C6.39411 13.3959 4.72441 12.4196 3.39234 11.1481C2.06956 9.88552 1 8.25243 1 6.38C1 5.30603 1.29526 4.22271 1.92595 3.39372Z'
				}
				fill={'currentcolor'}
			/>
		</svg>
	);
}