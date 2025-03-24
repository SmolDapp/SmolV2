import {useCallback, useEffect, useState} from 'react';
import {createPublicClient} from 'viem';
import {berachain} from 'viem/chains';
import {useAccount} from 'wagmi';

import {withRPC} from '@lib/contexts/WithMom';
import {toAddress} from '@lib/utils/tools.addresses';

type TENS = {name: string; avatar: string; isLoading: boolean};

const publicBeraClient = createPublicClient({
	chain: berachain,
	transport: withRPC(berachain)
});

export function useBeraname(): TENS {
	const {address} = useAccount();
	const [beraname, setBeraname] = useState<string | null>(null);
	const [beravatar, setBeravatar] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const fetchENSName = useCallback(async (): Promise<void> => {
		if (!address) {
			setIsLoading(false);
			setBeraname(null);
			setBeravatar(null);
			return;
		}
		setIsLoading(true);
		const ensName = await publicBeraClient.getEnsName({address: toAddress(address)});
		if (!ensName) {
			setIsLoading(false);
			setBeraname(null);
			setBeravatar(null);
			return;
		}
		const ensAvatar = await publicBeraClient.getEnsAvatar({name: ensName});
		setBeraname(ensName.replace('.bera', '.🐻⛓️'));
		setBeravatar(ensAvatar);
		setIsLoading(false);
	}, [address]);

	useEffect(() => {
		fetchENSName();
	}, [fetchENSName, address]);

	return {name: beraname || '', avatar: beravatar || '', isLoading: isLoading};
}
