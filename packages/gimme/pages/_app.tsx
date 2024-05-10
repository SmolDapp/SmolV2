import React from 'react';
import {Toaster} from 'react-hot-toast';
import {Inter} from 'next/font/google';
import Head from 'next/head';
import {mainnet} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {Header} from '@lib/common/Header';
import {Meta} from '@lib/common/Meta';
import {IconCheck} from '@lib/icons/IconCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const inter = Inter({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
	display: 'swap',
	variable: '--inter-font'
});

function MyApp({Component, ...props}: AppProps): ReactElement {
	return (
		<>
			<Head>
				<style
					jsx
					global>
					{`
						html {
							font-family: ${inter.className};
						}
					`}
				</style>
			</Head>
			<Meta />
			<WithMom
				supportedChains={[mainnet, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/1/tokenlistooor.json']}>
				<WalletContextApp>
					<div className={`${inter.variable}`}>
						<Header />
						<main className={'relative mx-auto mb-0 flex min-h-screen w-full flex-col'}>
							<Component {...props} />
						</main>
					</div>
				</WalletContextApp>
			</WithMom>
			<Toaster
				toastOptions={{
					duration: 5000,
					className: 'toast',
					success: {
						icon: <IconCheck className={'-mr-1 size-5 min-h-5 min-w-5 pt-1.5'} />,
						iconTheme: {
							primary: 'black',
							secondary: '#F1EBD9'
						}
					},
					error: {
						icon: <IconCircleCross className={'-mr-1 size-5 min-h-5 min-w-5 pt-1.5'} />,
						iconTheme: {
							primary: 'black',
							secondary: '#F1EBD9'
						}
					}
				}}
				position={'top-right'}
			/>
		</>
	);
}
export default MyApp;
