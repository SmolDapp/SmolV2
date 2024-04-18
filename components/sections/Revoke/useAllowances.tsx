import {useCallback,useState} from 'react';
import {parseAbiItem} from 'viem';
import {useAccount} from 'wagmi';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {getClient} from '@builtbymom/web3/utils/wagmi';
import {getLatestNotEmptyEvents} from '@utils/tools.revoke';

import type {TAddress} from '@builtbymom/web3/types';
import type {TAllowances} from '@utils/types/revokeType';

const parsedApprovalEvent = parseAbiItem(
	'event Approval(address indexed owner, address indexed sender, uint256 value)'
);

export const useAllowances = (
	refetch?: () => void
): {approvalEvents: TAllowances | null; refreshAllowances: (tokenAddresses: TAddress[]) => void} => {
	const {safeChainID, chainID} = useChainID();
	const {address} = useAccount();

	const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);

	const publicClient = getClient(isDev ? chainID : safeChainID);

	const [approvalEvents, set_approvalEvents] = useState<TAllowances | null>(null);

	const refreshAllowances = useCallback(
		async (tokenAddresses: TAddress[]) => {
			try {
				console.log('contract, ' + tokenAddresses);
				const approvalEvents = await publicClient.getLogs({
					address: tokenAddresses[0],
					event: parsedApprovalEvent,
					args: {
						owner: address
					},
					fromBlock: 1n
				});

				///--disable-block-gas-limit --block-base-fee-per-gas 0 --chain-id 1337 --auto-impersonate -b=1

				refetch?.();

				const filteredEvents = getLatestNotEmptyEvents(approvalEvents as TAllowances);
				set_approvalEvents(filteredEvents);
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error refreshing allowances:', error);
				}
			}
		},
		[address, publicClient]
	);

	return {approvalEvents, refreshAllowances};
};
