'use client';

import {Rubik, Source_Code_Pro} from 'next/font/google';
import localFont from 'next/font/local';
import type {ReactElement, ReactNode} from 'react';

const rubik = Rubik({
	weight: ['400', '500', '600', '700', '800'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--rubik-font'
});

const sourceCodePro = Source_Code_Pro({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--scp-font'
});

const monument = localFont({
	src: '../../public/fonts/MonumentExtended-Regular.otf',
	variable: '--monument-font',
	display: 'swap'
});

export function WithFonts({children}: {children: ReactNode}): ReactElement {
	return (
		<div
			style={{
				fontFamily: `${rubik.style.fontFamily}, ${sourceCodePro.style.fontFamily}, ${monument.style.fontFamily}	`
			}}>
			<style
				jsx
				global>
				{`
					:root {
						--rubik-font: ${rubik.style.fontFamily};
						--scp-font: ${sourceCodePro.style.fontFamily};
						--monument-font: ${monument.style.fontFamily};
				`}
			</style>

			{children}
		</div>
	);
}
