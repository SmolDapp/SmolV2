import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {parsedApprovalEvent, useInfiniteApprovalLogs} from '@lib/hooks/web3/useInfiniteContractLogs';
import {useDeepCompareMemo} from '@react-hookz/web';
import {getBlockNumber, readContracts, serialize} from '@wagmi/core';
import {useCallback, useEffect, useRef, useState} from 'react';
import {erc20Abi as abi} from 'viem';
import {getLogs} from 'viem/actions';
import {useAccount, useChainId, useConfig} from 'wagmi';

import {toBigInt} from '@lib/utils/numbers';
import {toAddress} from '@lib/utils/tools.addresses';
import {decodeAsBigInt} from '@lib/utils/tools.decoder';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {filterDuplicateEvents, getLatestNotEmptyEvents} from 'packages/smol/app/(apps)/revoke/utils/tools.revoke';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TAllowances} from 'packages/smol/app/(apps)/revoke/types';
import type {Log} from 'viem';

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
	const chainID = useChainId();
	const config = useConfig();
	const {address} = useAccount();
	const [allowances, setAllowances] = useState<TAllowances | undefined>(undefined);
	const [approveEvents, setApproveEvents] = useState<TAllowances | undefined>(undefined);
	const [isLoadingAllowances, setIsLoadingAllowances] = useState<boolean>(false);
	const currentIdentifier = useRef<string | undefined>(undefined);

	/**********************************************************************************************
	 ** We utilize a watcher to consistently obtain the latest approval events for the list of
	 ** tokens.
	 *********************************************************************************************/
	const {data, fromBlock, toBlock, isDoneWithInitialFetch} = useInfiniteApprovalLogs({
		chainID: chainID,
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
				const filteredEvents = getLatestNotEmptyEvents(data as TAllowances).map(item => ({
					...item,
					chainID
				}));
				setApproveEvents(filteredEvents);
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

		setIsLoadingAllowances(true);
		for (const token of approveEvents || []) {
			const from = {abi, address: toAddress(token.address), chainId: token.chainID, functionName: 'allowance'};
			calls.push({...from, args: [token.args.owner, token.args.sender]});
		}

		const allAllowances = await readContracts(config, {contracts: calls});
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
		setAllowances(ensureNoDuplicates);
		setIsLoadingAllowances(false);
	}, [approveEvents, config]);

	/**********************************************************************************************
	 ** getAllowancesForToken is a function that will fetch the allowances for the given token
	 ** address starting from the provided block number.
	 *********************************************************************************************/
	const getAllowancesForToken = useCallback(
		async (tokenAddress: TAddress, fromBlock: bigint) => {
			const logs: Log[] = [];
			const currentBlock = await getBlockNumber(config, {chainId: chainID});

			for (let i = fromBlock; i < currentBlock; i += 1_000_000n) {
				let toBlock = i + 1_000_000n;
				if (toBlock > currentBlock) {
					toBlock = currentBlock;
				}

				const res = await getLogs(config.getClient(), {
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

			setIsLoadingAllowances(true);
			for (const token of filteredEvents || []) {
				const from = {
					abi,
					address: toAddress(token.address),
					chainId: token.chainID,
					functionName: 'allowance'
				};
				calls.push({...from, args: [token.args.owner, token.args.sender]});
			}

			const allAllowances = await readContracts(config, {contracts: calls});
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
			setAllowances(prev => filterDuplicateEvents([...(prev || []), ..._allowances]));
			setIsLoadingAllowances(false);
		},
		[address, chainID, config]
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
