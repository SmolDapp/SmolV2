import {useCallback, useEffect, useState} from 'react';
import {createPublicClient} from 'viem';
import {berachainTestnetbArtio} from 'viem/chains';
import {useAccount} from 'wagmi';

import {withRPC} from '@lib/contexts/WithMom';
import {toAddress} from '@lib/utils/tools.addresses';

type TENS = {name: string; avatar: string; isLoading: boolean};

const berachain = {
	...berachainTestnetbArtio,
	contracts: {
		...berachainTestnetbArtio.contracts,
		ensRegistry: {
			address: toAddress('0xB0eef18971290b333450586D33dcA6cE122651D2')
		},
		ensUniversalResolver: {
			address: toAddress('0x41692Ef1EA0C79E6b73077E4A67572D2BDbD7057')
		}
	}
};
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
