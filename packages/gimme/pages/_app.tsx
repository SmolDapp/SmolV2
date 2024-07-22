import React from 'react';
import {Toaster} from 'react-hot-toast';
import {useRouter} from 'next/router';
import PlausibleProvider from 'next-plausible';
import {Meta} from 'lib/common/Meta';
import {IconCheck} from 'lib/icons/IconCheck';
import {IconCircleCross} from 'lib/icons/IconCircleCross';
import {mainnet} from 'viem/chains';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {Background} from '@gimmeDesignSystem/Background';
import {BackgroundLanding} from '@gimmeDesignSystem/BackgroundLanding';
import Layout from '@gimmeDesignSystem/Layout';
import {supportedNetworks} from '@gimmeutils/constants';
import {WithPopularTokens} from '@lib/contexts/usePopularTokens';
import {WithPrices} from '@lib/contexts/usePrices';

import {WithFonts} from '../components/WithFonts';
import {VaultsContextApp} from '../contexts/useVaults';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

function MyApp(props: AppProps): ReactElement {
	const {pathname} = useRouter();
	const isLandingPage = pathname === '/' || pathname === '/info';
	return (
		<WithFonts>
			<Meta
				title={'Gimme'}
				description={'DeFi yields, designed for everyone.'}
				titleColor={'#000000'}
				themeColor={'#FFD915'}
				og={'https://gimme.yearn.farm/og.png'}
				uri={'https://gimme.yearn.farm'}
			/>
			<WithMom
				supportedChains={[...supportedNetworks, mainnet]}
				defaultNetwork={supportedNetworks[0]}
				tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/137/yearn-min.json']}>
				<WalletContextApp>
					<WithPopularTokens>
						<WithPrices supportedNetworks={supportedNetworks}>
							<VaultsContextApp>
								<PlausibleProvider
									domain={process.env.PLAUSIBLE_DOMAIN || 'gimme.mom'}
									enabled={true}>
									<div className={'relative'}>
										{isLandingPage ? <BackgroundLanding /> : <Background />}
										<main
											className={
												'bg-grey-500 relative mb-0 flex size-full min-h-screen flex-col'
											}>
											<Layout {...props} />
										</main>
									</div>
								</PlausibleProvider>
							</VaultsContextApp>
						</WithPrices>
					</WithPopularTokens>
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
