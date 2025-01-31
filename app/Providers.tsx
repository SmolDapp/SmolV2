'use client';

import {SafeProvider} from '@gnosis.pm/safe-apps-react-sdk';
import PlausibleProvider from 'next-plausible';
import {Toaster} from 'react-hot-toast';

import {IconCheck} from '@lib/components/icons/IconCheck';
import {IconCircleCross} from '@lib/components/icons/IconCircleCross';
import {IndexedDB} from '@lib/contexts/useIndexedDB';
import {WithPopularTokens} from '@lib/contexts/usePopularTokens';
import {WalletContextApp} from '@lib/contexts/useWallet';
import {WithFonts} from '@lib/contexts/WithFonts';
import {WithMom} from '@lib/contexts/WithMom';
import {WithPrices} from '@lib/contexts/WithPrices/WithPrices';
import {networks, supportedNetworks} from '@lib/utils/tools.chains';

import type {ReactElement, ReactNode} from 'react';
import type {State} from 'wagmi';

function Providers(props: {children: ReactNode; initialState: State | undefined}): ReactElement {
	return (
		<WithFonts>
			<IndexedDB>
				<WithMom
					supportedChains={networks}
					initialState={props.initialState}
					tokenLists={['https://raw.githubusercontent.com/SmolDapp/tokenLists/main/lists/popular.json']}>
					<WalletContextApp
						shouldWorkOnTestnet={
							process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET)
						}>
						<WithPopularTokens>
							<WithPrices supportedNetworks={supportedNetworks}>
								<SafeProvider>
									<PlausibleProvider
										domain={process.env.PLAUSIBLE_DOMAIN || 'smold.app'}
										enabled={true}>
										{props.children}
									</PlausibleProvider>
								</SafeProvider>
							</WithPrices>
						</WithPopularTokens>
					</WalletContextApp>
				</WithMom>
			</IndexedDB>
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

export default Providers;
