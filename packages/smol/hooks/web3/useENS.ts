import {toAddress} from 'lib/utils/tools.addresses';
import {mainnet} from 'viem/chains';
import {useAccount, useEnsAvatar, useEnsName} from 'wagmi';

type TENS = {name: string; avatar: string; isLoading: boolean};

export function useENS(): TENS {
	const {address} = useAccount();
	const {data: ensName, isLoading: isLoadingENS} = useEnsName({
		chainId: mainnet.id,
		address: toAddress(address),
		query: {
			staleTime: Infinity,
			enabled: !!address
		}
	});
	const {data: ensAvatar, isLoading: isLoadingENSAvatar} = useEnsAvatar({
		name: ensName || undefined,
		chainId: 1,
		query: {enabled: !!ensName}
	});

	return {name: ensName || '', avatar: ensAvatar || '', isLoading: isLoadingENS || isLoadingENSAvatar};
}
