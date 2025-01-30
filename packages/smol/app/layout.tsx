import {headers} from 'next/headers';
import {cookieToInitialState} from 'wagmi';

import {config} from '@lib/contexts/WithMom';
import Providers from 'packages/smol/app/Providers';

import '../style.css';

import type {ReactElement} from 'react';

export default async function RootLayout(props: {children: ReactElement}): Promise<ReactElement> {
	const initialState = cookieToInitialState(config, (await headers()).get('cookie'));

	return (
		<html
			lang={'en'}
			className={'scrollbar-none'}
			suppressHydrationWarning>
			<head>
				<link
					rel={'preconnect'}
					href={'https://fonts.googleapis.com'}
				/>
				<link
					rel={'preconnect'}
					href={'https://fonts.gstatic.com'}
					crossOrigin={'anonymous'}
				/>
			</head>
			<body className={'bg-neutral-200 font-sans transition-colors duration-150'}>
				<main className={'h-app flex flex-col'}>
					<Providers initialState={initialState}>
						<div className={'mx-auto mt-10 w-full max-w-6xl'}>{props.children}</div>
					</Providers>
				</main>
			</body>
		</html>
	);
}
