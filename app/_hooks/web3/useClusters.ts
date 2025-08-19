import {Clusters, getImageUrl} from '@clustersxyz/sdk';
import {useState} from 'react';
import {useAccount} from 'wagmi';

import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {isAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';

type TClusters = {name: string; avatar: string};

export function useClusters(props?: {address: TAddress}): TClusters {
	const {address} = useAccount();
	const [clusters, setClusters] = useState<TClusters | undefined>(undefined);

	useAsyncTrigger(async (): Promise<void> => {
		if (props?.address && isAddress(props?.address)) {
			const clusters = new Clusters();
			const clustersTag = await clusters.getName(props?.address);
			if (clustersTag) {
				const [clustersName] = (clustersTag?.clusterName || '').split('/');
				const profileImage = getImageUrl(clustersName);
				setClusters({name: `${clustersName}/`, avatar: profileImage});
				return;
			}
		} else if (address && isAddress(address)) {
			const clusters = new Clusters();
			const clustersTag = await clusters.getName(address);
			if (clustersTag) {
				const [clustersName] = (clustersTag?.clusterName || '').split('/');
				const profileImage = getImageUrl(clustersName);
				setClusters({name: `${clustersName}/`, avatar: profileImage});
				return;
			}
		}
		setClusters(undefined);
	}, [address, props?.address]);

	return {name: clusters?.name || '', avatar: clusters?.avatar || ''};
}
