import React from 'react';
import localFont from 'next/font/local';

import type {ReactElement, ReactNode} from 'react';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Black.ttf',
			weight: '900',
			style: 'normal'
		}
	]
});

const aeonikMono = localFont({
	variable: '--font-aeonik-mono',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/AeonikMono-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/AeonikMono-Bold.woff2',
			weight: '700',
			style: 'normal'
		}
	]
});

export function WithFonts(props: {children: ReactNode}): ReactElement {
	return (
		<div style={{fontFamily: `${aeonik.style.fontFamily}, ${aeonikMono.style.fontFamily}`}}>
			<style
				jsx
				global>
				{`
					:root {
						--aeonik-font: ${aeonik.style.fontFamily};
						--font-aeonik-mono: ${aeonikMono.style.fontFamily};
					}
				`}
			</style>

			{props.children}
		</div>
	);
}
