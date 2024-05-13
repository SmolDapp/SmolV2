import {Toaster} from 'react-hot-toast';
import {Rubik, Source_Code_Pro} from 'next/font/google';
import PlausibleProvider from 'next-plausible';
import {WalletContextApp} from '@builtbymom/web3/contexts/useWallet';
import {WithMom} from '@builtbymom/web3/contexts/WithMom';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import {SafeProvider} from '@gnosis.pm/safe-apps-react-sdk';
import {IndexedDB} from '@smolContexts/useIndexedDB';
import Layout from '@lib/common/Layout';
import {Meta} from '@lib/common/Meta';
import {IconAppAddressBook, IconAppDisperse, IconAppEarn, IconAppSend, IconAppStream} from '@lib/icons/IconApps';
import {IconCheck} from '@lib/icons/IconCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconCross} from '@lib/icons/IconCross';
import {IconWallet} from '@lib/icons/IconWallet';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const rubik = Rubik({
	weight: ['400', '500', '600', '700'],
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
	},
	{
		href: '/apps/revoke',
		label: 'Revoke',
		icon: <IconCross />
	}
];

function MyApp(props: AppProps): ReactElement {
	return (
		<>
			<style
				jsx
				global>
				{`
					html {
						font-family: ${rubik.style.fontFamily}, ${sourceCodePro.style.fontFamily};
					}
				`}
			</style>
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
			<IndexedDB>
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
						<SafeProvider>
							<PlausibleProvider
								domain={process.env.PLAUSIBLE_DOMAIN || 'smold.app'}
								enabled={true}>
								<main className={`h-app flex flex-col ${rubik.variable} ${sourceCodePro.variable}`}>
									<Meta />
									<Layout
										{...(props as any)}
										menu={MENU}
									/>
								</main>
							</PlausibleProvider>
						</SafeProvider>
					</WalletContextApp>
				</WithMom>
			</IndexedDB>
		</>
	);
}

export default MyApp;
