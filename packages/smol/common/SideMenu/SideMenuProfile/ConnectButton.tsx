'use client';

import {IconWallet} from '@lib/icons/IconWallet';
import {cl} from '@lib/utils/helpers';

import {useLoginModal} from '@smolHooks/web3/useLoginModal';

import type {ReactElement} from 'react';

export function ConnectButton(): ReactElement {
	const openLoginModal = useLoginModal();

	return (
		<section
			className={cl(
				'h-[145px] w-full rounded-t-lg bg-neutral-0',
				'px-10 pb-6 pt-5',
				'flex flex-col justify-center items-center'
			)}>
			<div className={'mb-5 flex size-12 items-center justify-center rounded-full bg-neutral-300'}>
				<IconWallet className={'size-6 text-neutral-700'} />
			</div>
			<div className={'w-full max-w-72'}>
				<button
					onClick={openLoginModal}
					className={'bg-primary hover:bg-primaryHover h-8 w-full rounded-lg text-xs transition-colors'}>
					{'Connect Wallet'}
				</button>
			</div>
		</section>
	);
}
