import {type ReactElement, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal, useChainModal} from '@rainbow-me/rainbowkit';

export function ConnectButton(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {openChainModal} = useChainModal();
	const {isActive, address, ens, openLoginModal} = useWeb3();

	const buttonLabel = useMemo(() => {
		if (ens) {
			return ens;
		}
		if (address) {
			return truncateHex(address, 5);
		}
		return 'Connect wallet';
	}, [address, ens]);

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
			className={'rounded-lg border px-4 py-2 text-xs font-bold transition-colors'}>
			{buttonLabel}
		</button>
	);
}
