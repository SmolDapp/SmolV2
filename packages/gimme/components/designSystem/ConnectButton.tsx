import {type ReactElement, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal, useChainModal} from '@rainbow-me/rainbowkit';

export function ConnectButton(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {openChainModal} = useChainModal();
	const {isActive, address, ens, clusters, openLoginModal} = useWeb3();

	const buttonLabel = useMemo(() => {
		if (ens) {
			return ens;
		}
		if (clusters) {
			return clusters.name;
		}
		if (address) {
			return truncateHex(address, 5);
		}
		return 'Connect wallet';
	}, [address, clusters, ens]);

	return (
		<button
			onClick={(): void => {
				if (isActive) {
					openAccountModal?.();
				} else if (!isActive && address) {
					openChainModal?.();
				} else {
					openLoginModal();
				}
			}}
			className={'bg-primary hover:bg-primaryHover h-14 rounded-2xl font-medium transition-colors'}>
			{buttonLabel}
		</button>
	);
}
