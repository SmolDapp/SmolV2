import {type ReactElement} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isAddress} from '@builtbymom/web3/utils';
import {useIsMounted} from '@react-hookz/web';
import {NetworkPopoverSelector} from '@lib/common/NetworkSelector/Popover';
import {CoinBalance} from '@lib/common/SideMenu/SideMenuProfile/CoinBalance';
import {ConnectButton} from '@lib/common/SideMenu/SideMenuProfile/ConnectButton';
import {ProfileBox} from '@lib/common/SideMenu/SideMenuProfile/ProfileBox';
import {SkeletonPlaceholder} from '@lib/common/SideMenu/SideMenuProfile/SkeletonPlaceholder';

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

			<div className={'grid md:grid-cols-1 md:gap-2 lg:grid-cols-5 lg:gap-4'}>
				<div className={'col-span-3'}>
					<small>{'Chain'}</small>
					<NetworkPopoverSelector />
				</div>
				<div className={'col-span-2'}>
					<CoinBalance />
				</div>
			</div>
		</section>
	);
}
