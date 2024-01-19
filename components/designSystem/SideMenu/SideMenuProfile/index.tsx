import {type ReactElement} from 'react';
import {NetworkPopoverSelector} from 'components/designSystem/NetworkSelector/Popover';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isAddress} from '@builtbymom/web3/utils';
import {useIsMounted} from '@react-hookz/web';

import {CoinBalance} from './CoinBalance';
import {ConnectButton} from './ConnectButton';
import {ProfileBox} from './ProfileBox';
import {SkeletonPlaceholder} from './SkeletonPlaceholder';

export function SideMenuProfile(): ReactElement {
	const isMounted = useIsMounted();
	const {address} = useWeb3();

	if (!isMounted()) {
		return <SkeletonPlaceholder />;
	}

	if (!isAddress(address)) {
		return <ConnectButton />;
	}

	return (
		<section className={'p-4'}>
			<ProfileBox />

			<hr className={'mb-2 mt-4 text-neutral-200'} />

			<div className={'grid grid-cols-2 gap-6'}>
				<div>
					<small>{'Chain'}</small>
					<NetworkPopoverSelector />
				</div>
				<CoinBalance />
			</div>
		</section>
	);
}