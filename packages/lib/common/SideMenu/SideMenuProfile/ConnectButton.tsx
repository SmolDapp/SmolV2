import {type ReactElement} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl} from '@builtbymom/web3/utils';
import {IconWallet} from '@lib/icons/IconWallet';

export function ConnectButton(): ReactElement {
	const {onConnect} = useWeb3();

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
					onClick={onConnect}
					className={'bg-primary hover:bg-primaryHover h-8 w-full rounded-lg text-xs transition-colors'}>
					{'Connect Wallet'}
				</button>
			</div>
		</section>
	);
}
