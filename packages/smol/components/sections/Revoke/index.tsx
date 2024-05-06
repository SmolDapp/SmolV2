import {type ReactElement} from 'react';
import {useAccount} from 'wagmi';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useTokensWithBalance} from '@hooks/useTokensWithBalance';
import {useDeepCompareEffect} from '@react-hookz/web';

import {useAllowances} from './useAllowances';
import {RevokeWizard} from './Wizard';

export function Revoke(): ReactElement {
	const {refreshApproveEvents} = useAllowances();
	const {currentNetworkTokenList} = useTokenList();
	const {tokensWithBalance} = useTokensWithBalance();

	const {address} = useAccount();

	useDeepCompareEffect(() => {
		if (!address) {
			return;
		}

		refreshApproveEvents(Object.values(currentNetworkTokenList).map(item => item.address));
	}, [address, currentNetworkTokenList, refreshApproveEvents, tokensWithBalance]);

	return (
		<div className={'max-w-108 w-full'}>
			<RevokeWizard />
		</div>
	);
}
