import {useCallback, useEffect, useRef, useState} from 'react';
import {type TAllowances} from 'packages/lib/types/Revoke';
import {filterDuplicateEvents, getLatestNotEmptyEvents} from 'packages/lib/utils/tools.revoke';
import {erc20Abi as abi} from 'viem';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {decodeAsBigInt, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {useDeepCompareMemo} from '@react-hookz/web';
import {parsedApprovalEvent, useInfiniteApprovalLogs} from '@smolHooks/useInfiniteContractLogs';
import {getBlockNumber, readContracts, serialize} from '@wagmi/core';
import {isDev} from '@lib/utils/tools.chains';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import type {Log} from 'viem';
import type {TAddress} from '@builtbymom/web3/types/address';

type TUseHistoricalAllowances = {
	allowances: TAllowances | undefined;
	fromBlock: bigint | undefined;
	toBlock: bigint | undefined;
	isDoneWithInitialFetch: boolean;
	isLoadingAllowances: boolean;
	getAllowancesForToken: (tokenAddress: TAddress, fromBlock: bigint) => Promise<void>;
};
function useHistoricalAllowances(props: {
	tokenAddresses: TAddress[] | undefined;
	fromBlock: bigint | undefined;
}): TUseHistoricalAllowances {
	const {address} = useWeb3();
	const {chainID, safeChainID} = useChainID();
	const [allowances, set_allowances] = useState<TAllowances | undefined>(undefined);
	const [approveEvents, set_approveEvents] = useState<TAllowances | undefined>(undefined);
	const [isLoadingAllowances, set_isLoadingAllowances] = useState<boolean>(false);
	const currentIdentifier = useRef<string | undefined>();

	/**********************************************************************************************
	 ** We utilize a watcher to consistently obtain the latest approval events for the list of
	 ** tokens.
	 *********************************************************************************************/
	const {data, fromBlock, toBlock, isDoneWithInitialFetch} = useInfiniteApprovalLogs({
		chainID: isDev ? chainID : safeChainID,
		addresses: props.tokenAddresses,
		startBlock: props.fromBlock || 0n,
		owner: toAddress(address),
		pageSize: 1_000_000n,
		enabled: Boolean(toBigInt(props.fromBlock) >= 0n)
	});

	/**********************************************************************************************
	 ** Once we've gathered all the latest allowances from the blockchain, we aim to utilize only
	 ** those with a value. Therefore, we arrange them by block number to prioritize the latest
	 ** ones and filter out those with null values.
	 ** Once thing to note is that we are using a ref to store the current identifier. This is
	 ** because we want to avoid re-processing the data if it hasn't changed, which can cause
	 ** unnecessary/infinite re-renders.
	 *********************************************************************************************/
	useEffect((): void => {
		if (isDoneWithInitialFetch) {
			const identifier = createUniqueID(serialize(data));
			if (currentIdentifier.current === identifier) {
				return;
			}
			currentIdentifier.current = identifier;

			if (data) {
				const filteredEvents = getLatestNotEmptyEvents(data as TAllowances).map(item => ({...item, chainID}));
				set_approveEvents(filteredEvents);
			}
		}
	}, [data, chainID, isDoneWithInitialFetch]);

	/**********************************************************************************************
	 ** Once we've gathered approval events for the token list, we need to verify if allowances
	 ** still persist on the chain and haven't been utilized by the contract. To achieve this, we
	 ** utilize the allowance function on the ERC20 contract.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		const calls = [];
		if (!approveEvents) {
			return;
		}

		set_isLoadingAllowances(true);
		for (const token of approveEvents || []) {
			const from = {abi, address: toAddress(token.address), chainId: token.chainID, functionName: 'allowance'};
			calls.push({...from, args: [token.args.owner, token.args.sender]});
		}

		const allAllowances = await readContracts(retrieveConfig(), {contracts: calls});
		const allAllowancesValues = allAllowances.map(item => decodeAsBigInt(item));
		const _allowances: TAllowances = [];
		for (let i = 0; i < approveEvents.length; i++) {
			_allowances.push({
				...approveEvents[i],
				args: {
					...approveEvents[i].args,
					value: allAllowancesValues[i]
				}
			});
		}

		const ensureNoDuplicates = filterDuplicateEvents(_allowances);
		set_allowances(ensureNoDuplicates);
		set_isLoadingAllowances(false);
	}, [approveEvents]);

	/**********************************************************************************************
	 ** getAllowancesForToken is a function that will fetch the allowances for the given token
	 ** address starting from the provided block number.
	 *********************************************************************************************/
	const getAllowancesForToken = useCallback(
		async (tokenAddress: TAddress, fromBlock: bigint) => {
			const logs: Log[] = [];
			const currentBlock = await getBlockNumber(retrieveConfig(), {chainId: chainID});

			for (let i = fromBlock; i < currentBlock; i += 1_000_000n) {
				let toBlock = i + 1_000_000n;
				if (toBlock > currentBlock) {
					toBlock = currentBlock;
				}

				const res = await getClient(chainID).getLogs({
					address: [toAddress(tokenAddress)],
					event: parsedApprovalEvent,
					args: {owner: address},
					fromBlock: 0n,
					toBlock: toBlock
				});
				logs.push(...res);
			}

			const filteredEvents = getLatestNotEmptyEvents(logs as unknown as TAllowances).map(item => ({
				...item,
				chainID
			}));

			const calls = [];
			if (!filteredEvents) {
				return;
			}

			set_isLoadingAllowances(true);
			for (const token of filteredEvents || []) {
				const from = {
					abi,
					address: toAddress(token.address),
					chainId: token.chainID,
					functionName: 'allowance'
				};
				calls.push({...from, args: [token.args.owner, token.args.sender]});
			}

			const allAllowances = await readContracts(retrieveConfig(), {contracts: calls});
			const allAllowancesValues = allAllowances.map(item => decodeAsBigInt(item));
			const _allowances: TAllowances = [];
			for (let i = 0; i < filteredEvents.length; i++) {
				_allowances.push({
					...filteredEvents[i],
					args: {
						...filteredEvents[i].args,
						value: allAllowancesValues[i]
					}
				});
			}
			set_allowances(prev => filterDuplicateEvents([...(prev || []), ..._allowances]));
			set_isLoadingAllowances(false);
		},
		[address, chainID]
	);

	/**********************************************************************************************
	 ** We return the allowances, the block range, the loading state, and the function to fetch
	 ** the allowances for a token.
	 *********************************************************************************************/
	return useDeepCompareMemo(
		() => ({
			allowances,
			isLoadingAllowances,
			fromBlock,
			toBlock,
			isDoneWithInitialFetch,
			getAllowancesForToken
		}),
		[allowances, isLoadingAllowances, fromBlock, toBlock, isDoneWithInitialFetch, getAllowancesForToken]
	);
}

export {useHistoricalAllowances};
