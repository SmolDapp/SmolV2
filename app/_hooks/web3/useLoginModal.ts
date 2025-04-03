import {useAccountModal, useChainModal, useConnectModal} from '@rainbow-me/rainbowkit';
import {useCallback} from 'react';
import {useAccount, useConnect} from 'wagmi';

export function useLoginModal(): () => Promise<void> {
	const {address, isConnected, connector, chain} = useAccount();
	const {connectors, connectAsync} = useConnect();
	const {openAccountModal} = useAccountModal();
	const {openConnectModal} = useConnectModal();
	const {openChainModal} = useChainModal();

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

	const openLoginModal = useCallback(async (): Promise<void> => {
		if (isConnected && connector && address) {
			if (openAccountModal) {
				openAccountModal();
			} else {
				if (openChainModal) {
					openChainModal();
					return;
				}
				console.warn('Impossible to open account modal');
			}
		} else {
			const ledgerConnector = connectors.find((c): boolean => c.id.toLowerCase().includes('ledger'));
			if (isIframe() && ledgerConnector) {
				await connectAsync({connector: ledgerConnector, chainId: chain?.id});
				return;
			}
			const safeConnector = connectors.find((c): boolean => c.id.toLowerCase().includes('safe'));
			if (safeConnector) {
				await connectAsync({connector: safeConnector, chainId: chain?.id});
				return;
			}
			if (openConnectModal) {
				openConnectModal();
			} else {
				if (openChainModal) {
					openChainModal();
					return;
				}
				console.warn('Impossible to open login modal');
			}
		}
	}, [
		address,
		chain?.id,
		connectAsync,
		connector,
		connectors,
		isConnected,
		openAccountModal,
		openChainModal,
		openConnectModal
	]);

	return openLoginModal;
}
