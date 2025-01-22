'use client';

import {Rubik, Source_Code_Pro} from 'next/font/google';
import React from 'react';

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

export function WithFonts({children}: {children: ReactNode}): ReactElement {
	return (
		<div style={{fontFamily: `${rubik.style.fontFamily}, ${sourceCodePro.style.fontFamily}`}}>
			<style
				jsx
				global>
				{`
					:root {
						--rubik-font: ${rubik.style.fontFamily};
						--scp-font: ${sourceCodePro.style.fontFamily};
					}
				`}
			</style>

			{children}
		</div>
	);
}
