import React, {useEffect, useState} from 'react';
import {IconWallet} from 'packages/lib/icons/IconWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';
import {useAccountModal, useChainModal} from '@rainbow-me/rainbowkit';
import {useIsMounted} from '@react-hookz/web';

import type {ReactElement} from 'react';

export function WalletSelector(): ReactElement {
	const {openAccountModal} = useAccountModal();
	const {openChainModal} = useChainModal();
	const {isActive, address, ens, lensProtocolHandle, openLoginModal} = useWeb3();

	const [walletIdentity, set_walletIdentity] = useState<string | undefined>(undefined);
	const isMounted = useIsMounted();

	useEffect((): void => {
		if (!isMounted()) {
			return;
		}
		if (!isActive && address) {
			set_walletIdentity('Invalid Network');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (lensProtocolHandle) {
			set_walletIdentity(lensProtocolHandle);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 6));
		} else {
			set_walletIdentity(undefined);
		}
	}, [ens, lensProtocolHandle, address, isActive, isMounted]);

	return (
		<div
			onClick={(): void => {
				if (isActive) {
					openAccountModal?.();
				} else if (!isActive && address) {
					openChainModal?.();
				} else {
					openLoginModal();
				}
			}}>
			<div
				suppressHydrationWarning
				className={'font-inter cursor-pointer text-sm font-medium'}>
				{walletIdentity ? (
					walletIdentity
				) : (
					<span>
						<IconWallet className={'mt-0.5 block size-4 md:hidden'} />
						<span
							className={
								'text-neutral-0 relative hidden h-8 cursor-pointer items-center justify-center !rounded-md border border-transparent bg-neutral-900 px-2 text-xs font-normal transition-all hover:bg-neutral-800 md:flex'
							}>
							{'Connect wallet'}
						</span>
					</span>
				)}
			</div>
		</div>
	);
}
