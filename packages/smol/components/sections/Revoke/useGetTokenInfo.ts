import {erc20Abi} from 'viem';
import {useReadContracts} from 'wagmi';

import type {TAddress} from '@builtbymom/web3/types';

type TTokenInfo = {
	tokenName?: string;
	tokenDecimals?: number;
	tokenSymbol?: string;
	loading: boolean;
};

export const useGetTokenInfo = (tokenAddress?: TAddress): TTokenInfo => {
	const {data: tokenInfo, isLoading} = useReadContracts({
		allowFailure: false,
		contracts: [
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'name'
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'decimals'
			},
			{
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'symbol'
			}
		]
	});

	return {
		tokenName: tokenInfo?.[0],
		tokenDecimals: tokenInfo?.[1],
		tokenSymbol: tokenInfo?.[2],
		loading: isLoading
	};
};
