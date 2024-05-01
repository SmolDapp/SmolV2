import React from 'react';
import {Toaster} from 'react-hot-toast';
import PlausibleProvider from 'next-plausible';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {WithPopularTokens} from '@contexts/usePopularTokens';
import {SafeProvider} from '@gnosis.pm/safe-apps-react-sdk';
import {WithPopularTokens} from '@smolContexts/usePopularTokens';
import Layout from '@lib/common/Layout';
import {Meta} from '@lib/common/Meta';
import {WithFonts} from '@lib/common/WithFonts';
import {IconAppAddressBook, IconAppDisperse, IconAppEarn, IconAppSend, IconAppStream} from '@lib/icons/IconApps';
import {IconCheck} from '@lib/icons/IconCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconWallet} from '@lib/icons/IconWallet';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const MENU = [
	{
		href: '/apps/send',
		label: 'Send',
		icon: <IconAppSend />
	},
	{
		href: '/apps/disperse',
		label: 'Disperse',
		icon: <IconAppDisperse />
	},
	{
		href: '/apps/earn',
		label: 'Earn',
		isDisabled: true,
		icon: <IconAppEarn />
	},
	{
		href: '/apps/stream',
		label: 'Stream',
		isDisabled: true,
		icon: <IconAppStream />
	},
	{
		href: '/apps/address-book',
		label: 'Address Book',
		icon: <IconAppAddressBook />
	},
	{
		href: '/apps/wallet',
		label: 'Wallet',
		icon: <IconWallet />
	}
];

function MyApp(props: AppProps): ReactElement {
	return (
		<WithFonts>
			<Meta
				title={'SmolDapp'}
				description={
					'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.'
				}
				titleColor={'#000000'}
				themeColor={'#FFD915'}
				og={'https://smold.app/og.png'}
				uri={'https://smold.app'}
			/>
			<WithMom
				supportedChains={[...supportedNetworks, localhost]}
				tokenLists={[
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/tokenlistooor.json',
					'https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/defillama.json'
				]}>
				<WalletContextApp
					shouldWorkOnTestnet={
						process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET)
					}>
					<WithPopularTokens>
						<SafeProvider>
							<PlausibleProvider
								domain={process.env.PLAUSIBLE_DOMAIN || 'smold.app'}
								enabled={true}>
								<main className={'h-app flex flex-col'}>
									<Layout
										{...(props as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
										menu={MENU}
									/>
								</main>
							</PlausibleProvider>
						</SafeProvider>
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
