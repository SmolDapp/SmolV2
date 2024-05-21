import React from 'react';
import {Toaster} from 'react-hot-toast';
import {Meta} from 'lib/common/Meta';
import {IconCheck} from 'lib/icons/IconCheck';
import {IconCircleCross} from 'lib/icons/IconCircleCross';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import Layout from '@gimmeDesignSystem/Layout';
import {WithFonts} from '@lib/common/WithFonts';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

function MyApp(props: AppProps): ReactElement {
	return (
		<WithFonts>
			<Meta
				title={'Gimme'}
				description={'Just Gimme'}
				titleColor={'#000000'}
				themeColor={'#FFD915'}
				og={'https://smold.app/og.png'}
				uri={'https://smold.app'}
			/>
			<WithMom
				supportedChains={[...supportedNetworks, localhost]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/yearn-min.json']}>
				<WalletContextApp>
					<VaultsContextApp>
						<main className={'relative mb-0 flex min-h-screen w-full flex-col'}>
							<Layout {...props} />
						</main>
					</VaultsContextApp>
				</WalletContextApp>
			</WithMom>
			<Toaster
				toastOptions={{
					duration: 5_000,
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
		</WithFonts>
	);
}

export default MyApp;
