import {useDeepCompareEffect} from '@react-hookz/web';
import {useInfiniteQuery} from '@tanstack/react-query';
import {isZeroAddress} from 'lib/utils/tools.addresses';
import {useCallback, useEffect, useState} from 'react';
import {parseAbiItem} from 'viem';
import {getLogs} from 'viem/actions';
import {useBlockNumber, useConfig} from 'wagmi';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {Log} from 'viem';

type TUseContractLogsProps = {
	chainID: number;
	owner: TAddress;
	addresses: TAddress[] | undefined;
	startBlock: bigint;
	pageSize: bigint;
	enabled: boolean;
};

type TPageParam = {
	fromBlock: bigint;
	toBlock: bigint;
};

/**************************************************************************************************
 ** parsedApprovalEvent corresponds to the event we want to listen with our useInfiniteApprovalLogs
 ** hook. This event is the Approval event from the ERC20 standard.
 *************************************************************************************************/
export const parsedApprovalEvent = parseAbiItem(
	'event Approval(address indexed owner, address indexed sender, uint256 value)'
);

/**************************************************************************************************
 ** The useInfiniteApprovalLogs function is a wrapper around the useInfiniteQuery hook from
 ** react-query. It allows us to fetch the approval events for a given owner address for a given
 ** list of token addresses on a given chain.
 ** This will fetch all logs from the startBlock to the endBlock, with a corresponding pageSize
 ** to gracefully handle nodes that have a limit on the number of logs that can be fetched in a
 ** single request.
 ** When the endBlock is reached, the hook will stop fetching new logs until a new block is mined.
 ** When the block is mined, the hook will fetch the new logs and append them to the existing list.
 **
 ** @dev This hook is dynamic and the returned value will mutate with the new logs.
 *************************************************************************************************/
export function useInfiniteApprovalLogs({
	chainID,
	addresses,
	owner,
	startBlock,
	pageSize,
	enabled
}: TUseContractLogsProps): {
	data: Log[] | [];
	fromBlock: bigint | undefined;
	toBlock: bigint | undefined;
	isDoneWithInitialFetch: boolean;
} {
	const config = useConfig();
	const {data: endBlock} = useBlockNumber({watch: true, chainId: chainID});
	const [isDoneWithInitialFetch, setIsDoneWithInitialFetch] = useState(false);

	/**********************************************************************************************
	 ** If we are getting a new chainID, addresses, or owner, we want to reset the
	 ** isDoneWithInitialFetch flag to false. This will allow us to fetch the logs again.
	 *********************************************************************************************/
	useDeepCompareEffect(() => {
		setIsDoneWithInitialFetch(false);
	}, [chainID, addresses, owner]);

	/**********************************************************************************************
	 ** hasNextPage is a function that will return the next page to fetch if there are still logs
	 ** to fetch. If the endBlock is reached, the function will return undefined, which is used to
	 ** indicate that we want to fetch everything up to the endBlock.
	 *********************************************************************************************/
	const hasNextPage = useCallback(
		(lastPageParam: TPageParam): TPageParam | undefined => {
			if (!endBlock) {
				return undefined;
			}
			const nextPage: TPageParam = {
				fromBlock: lastPageParam.toBlock + 1n,
				toBlock: lastPageParam.toBlock + pageSize
			};
			if (nextPage.fromBlock > endBlock) {
				return undefined;
			}
			if (nextPage.toBlock > endBlock) {
				nextPage.toBlock = endBlock;
			}
			return nextPage;
		},
		[endBlock, pageSize]
	);

	/**********************************************************************************************
	 ** query is the react-query hook that will fetch the logs from the chain. It will fetch the
	 ** logs for the given addresses, owner, and startBlock. It will fetch the logs in a paginated
	 ** way, with a page size of pageSize. It will fetch the logs until the hasNextPage function
	 ** returns undefined, which means that we have reached the endBlock.
	 ** It will only be triggered if the owner is not the zero address and it will flat the results
	 ** in a single array.
	 *********************************************************************************************/
	const query = useInfiniteQuery({
		retry: false,
		queryKey: ['infinite_contract_logs', addresses, startBlock.toString(), chainID, owner],
		queryFn: async ({pageParam}) => {
			return getLogs(config.getClient(), {
				address: addresses,
				event: parsedApprovalEvent,
				args: {owner},
				fromBlock: pageParam.fromBlock,
				toBlock: pageParam.toBlock
			});
		},
		initialPageParam: {
			fromBlock: startBlock,
			toBlock: startBlock + pageSize - 1n
		},
		getNextPageParam: (_lastPage, _allPages, lastPageParam) => hasNextPage(lastPageParam),
		select: data => {
			const numberOfPages = data.pageParams.length;
			return {
				items: data.pages.flat(),
				fromBlock: data.pageParams[numberOfPages - 1]?.fromBlock || 0n,
				toBlock: endBlock || 0n
			};
		},
		staleTime: Number.POSITIVE_INFINITY,
		enabled: !isZeroAddress(owner) && (addresses || []).length > 0 && enabled
	});

	/**********************************************************************************************
	 ** Simple useEffect that will trigger the fetch of the next page if the query is not fetching
	 ** and there are still logs to fetch.
	 *********************************************************************************************/
	useEffect(() => {
		if (!query.isFetching && query.hasNextPage) {
			query.fetchNextPage();
		}
		if (!query.hasNextPage && !isDoneWithInitialFetch && endBlock !== undefined && query.isFetched) {
			setTimeout(() => {
				setIsDoneWithInitialFetch(true);
			}, 100);
		}
	}, [query.isFetching, query.hasNextPage, query, isDoneWithInitialFetch, endBlock]);

	/**********************************************************************************************
	 ** If addresses is undefined, this means that the tokens are still loading. If the number
	 ** of addresses is 0, this means that there are no tokens to fetch logs for. In this case,
	 ** we set the isDoneWithInitialFetch flag to true.
	 *********************************************************************************************/
	useEffect(() => {
		if (addresses !== undefined && addresses.length === 0) {
			setIsDoneWithInitialFetch(true);
		}
	}, [addresses]);

	/**********************************************************************************************
	 ** If the query fails, we log the failure reason and set the isDoneWithInitialFetch flag to
	 ** true.
	 *********************************************************************************************/
	useEffect(() => {
		if (query.failureReason) {
			console.error(query.failureReason);
			setIsDoneWithInitialFetch(true);
		}
	}, [query.failureReason]);

	return {
		data: query.data?.items || [],
		fromBlock: query.data?.fromBlock,
		toBlock: query.data?.toBlock,
		isDoneWithInitialFetch
	};
}
