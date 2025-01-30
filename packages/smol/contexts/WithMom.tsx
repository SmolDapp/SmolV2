'use client';

import {WithTokenList} from '@lib/contexts/WithTokenList';
import {RainbowKitProvider, getDefaultConfig} from '@rainbow-me/rainbowkit';
import {
	coinbaseWallet,
	frameWallet,
	injectedWallet,
	ledgerWallet,
	metaMaskWallet,
	rainbowWallet,
	safeWallet,
	walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {cookieStorage, createStorage, fallback, http} from '@wagmi/core';
import {Fragment} from 'react';
import {WagmiProvider} from 'wagmi';

import {networks} from '@lib/utils/tools.chains';

import type {AvatarComponent, DisclaimerComponent, Theme} from '@rainbow-me/rainbowkit';
import type {ReactElement} from 'react';
import type {Chain} from 'viem';
import type {State} from 'wagmi';

export function withRPC(network: Chain): ReturnType<typeof fallback> {
	const httpTransport: string[] = [];

	const newRPC = process.env.RPC_URI_FOR?.[network.id] || '';
	const newRPCBugged = process.env[`RPC_URI_FOR_${network.id}`];
	const oldRPC = process.env.JSON_RPC_URI?.[network.id] || process.env.JSON_RPC_URL?.[network.id];
	const defaultJsonRPCURL = network?.rpcUrls?.public?.http?.[0];
	const injectedRPC = newRPC || oldRPC || newRPCBugged || defaultJsonRPCURL || '';

	if (injectedRPC) {
		httpTransport.push(injectedRPC);
	}
	if (network?.rpcUrls['alchemy']?.http[0] && process.env.ALCHEMY_KEY) {
		httpTransport.push(`${network?.rpcUrls['alchemy'].http[0]}/${process.env.ALCHEMY_KEY}`);
	}
	if (network?.rpcUrls['infura']?.http[0] && process.env.INFURA_PROJECT_ID) {
		httpTransport.push(`${network?.rpcUrls['infura'].http[0]}/${process.env.INFURA_PROJECT_ID}`);
	}
	if (!network.rpcUrls.default) {
		network.rpcUrls.default = {http: [], webSocket: []};
	}
	const defaultHttp = [...new Set([...httpTransport, ...(network.rpcUrls.default?.http || [])].filter(Boolean))];

	return fallback(defaultHttp.map(rpc => http(rpc)));
}

const allTransports: Record<number, ReturnType<typeof fallback>> = {};
for (const chain of networks) {
	allTransports[chain.id] = withRPC(chain);
}

export const config = getDefaultConfig({
	appName: (process.env.WALLETCONNECT_PROJECT_NAME as string) || '',
	projectId: process.env.WALLETCONNECT_PROJECT_ID as string,
	chains: networks as any,
	ssr: true,
	syncConnectedChain: true,
	wallets: [
		{
			groupName: 'Popular',
			wallets: [
				injectedWallet,
				frameWallet,
				metaMaskWallet,
				walletConnectWallet,
				rainbowWallet,
				ledgerWallet,
				coinbaseWallet,
				safeWallet
			]
		}
	],
	storage: createStorage({
		storage: cookieStorage
	}),
	transports: allTransports
});

type TWithMom = {
	children: ReactElement;
	initialState?: State;
	defaultNetwork?: Chain;
	supportedChains: Chain[];
	tokenLists?: string[];
	rainbowConfig?: {
		initialChain?: Chain | number;
		id?: string;
		theme?: Theme | null;
		showRecentTransactions?: boolean;
		appInfo?: {
			appName?: string;
			learnMoreUrl?: string;
			disclaimer?: DisclaimerComponent;
		};
		coolMode?: boolean;
		avatar?: AvatarComponent;
		modalSize?: 'compact' | 'wide';
	};
};

const queryClient = new QueryClient();
function WithMom({children, tokenLists, rainbowConfig, initialState}: TWithMom): ReactElement {
	function isIframe(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}
		if (
			window !== window.top ||
			window.top !== window.self ||
			(document?.location?.ancestorOrigins || []).length !== 0
		) {
			return true;
		}
		return false;
	}

	return (
		<WagmiProvider
			config={config}
			reconnectOnMount={!isIframe()}
			initialState={initialState}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider {...rainbowConfig}>
					<WithTokenList lists={tokenLists}>
						<Fragment>{children}</Fragment>
					</WithTokenList>
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export {WithMom};
