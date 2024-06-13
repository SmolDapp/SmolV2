import {useState} from 'react';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {isAddress} from '@builtbymom/web3/utils';
import {Clusters, getImageUrl} from '@clustersxyz/sdk';

import type {TAddress} from '@builtbymom/web3/types';

type TClusters = {
	name: string;
	avatar: string;
};

/**********************************************************************************************
 ** The useClusters hook is used to retrieve the cluster name and avatar for a given address.
 ** It uses the Clusters SDK to retrieve the information.
 *********************************************************************************************/
export function useClusters(address: TAddress): TClusters | undefined {
	const [clusters, set_clusters] = useState<TClusters | undefined>(undefined);

	useAsyncTrigger(async (): Promise<void> => {
		if (isAddress(address)) {
			const clusters = new Clusters();
			const clustersTag = await clusters.getName(address);
			if (clustersTag) {
				const [clustersName] = clustersTag.split('/');
				const profileImage = getImageUrl(clustersName);
				set_clusters({name: `${clustersName}/`, avatar: profileImage});
				return;
			}
		}
		set_clusters(undefined);
	}, [address]);

	return clusters;
}
