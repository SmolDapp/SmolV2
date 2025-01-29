import {AGGREGATE3_ABI} from '@lib/utils/abi/aggregate.abi';
import {toNormalizedBN} from '@lib/utils/numbers';
import {decodeAsBigInt, decodeAsNumber, decodeAsString} from '@lib/utils/tools.decoder';
import {createUniqueID} from '@lib/utils/tools.identifiers';
import {deserialize, multicall, serialize} from '@wagmi/core';
import {ethTokenAddress, isEthAddress, isZeroAddress, toAddress} from 'lib/utils/tools.addresses';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {erc20Abi} from 'viem';
import {useAccount, useConfig} from 'wagmi';

import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';
import {useDeepCompareMemo} from '@smolHooks/useDeepCompare';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TChainERC20Tokens, TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {Config, MulticallParameters} from '@wagmi/core';
import type {DependencyList} from 'react';
import type {Connector} from 'wagmi';

// eslint-disable-next-line @typescript-eslint/naming-convention
const SHOULD_FETCH_ALL_CHAINS = false;
const MULTICALL3_ADDRESS = toAddress('0xcA11bde05977b3631167028862bE2a173976CA11');

/*******************************************************************************
 ** Request, Response and helpers for the useBalances hook.
 ******************************************************************************/
export type TDefaultStatus = {
	isFetching: boolean;
	isFetched: boolean;
	isRefetching: boolean;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
};
export type TUseBalancesTokens = {
	address: TAddress;
	chainID: number;
	decimals?: number;
	name?: string;
	symbol?: string;
	for?: string;
};
export type TUseBalancesReq = {
	key?: string | number;
	tokens: TUseBalancesTokens[];
	priorityChainID?: number;
	effectDependencies?: DependencyList;
	provider?: Connector;
};

export type TChainStatus = {
	chainLoadingStatus: Record<number, boolean>;
	chainSuccessStatus: Record<number, boolean>;
	chainErrorStatus: Record<number, boolean>;
};

export type TUseBalancesRes = {
	data: TChainERC20Tokens;
	onUpdate: (shouldForceFetch?: boolean) => Promise<TChainERC20Tokens>;
	onUpdateSome: (token: TUseBalancesTokens[], shouldForceFetch?: boolean) => Promise<TChainERC20Tokens>;
	onUpdateTokensForChain: (chainID: number) => Promise<void>;
	error?: Error;
	status: 'error' | 'loading' | 'success' | 'unknown';
} & Omit<TDefaultStatus, 'isFetched' | 'isRefetching' | 'isFetching'> &
	TChainStatus;

type TDataRef = {
	nonce: number;
	address: TAddress;
	balances: TChainERC20Tokens;
};

type TUpdates = Record<string, TERC20TokensWithBalance & {lastUpdate: number; owner: TAddress}>; // key=chainID/address
const TOKEN_UPDATE: TUpdates = {};

/*******************************************************************************
 ** Default status for the loading state.
 ******************************************************************************/
const defaultStatus = {
	isLoading: false,
	isFetching: false,
	isSuccess: false,
	isError: false,
	isFetched: false,
	isRefetching: false
};

const defaultChainStatus = {
	chainLoadingStatus: {},
	chainSuccessStatus: {},
	chainErrorStatus: {}
};

export async function performCall(
	chainID: number,
	chunckCalls: MulticallParameters['contracts'],
	tokens: TUseBalancesTokens[],
	ownerAddress: TAddress,
	config: Config
): Promise<[Record<TAddress, TERC20TokensWithBalance>, Error | undefined]> {
	let results: (
		| {
				error?: undefined;
				result: never;
				status: 'success';
		  }
		| {
				error: Error;
				result?: undefined;
				status: 'failure';
		  }
	)[] = [];
	try {
		results = await multicall(config, {
			contracts: chunckCalls as never[],
			chainId: chainID
		});
	} catch (error) {
		console.error(`Failed to trigger multicall on chain ${chainID}`, error);
		return [{}, error as Error];
	}

	const _data: Record<TAddress, TERC20TokensWithBalance> = {};
	const hasOwnerAddress = Boolean(ownerAddress) && !isZeroAddress(ownerAddress);
	const tokensAsObject: Record<TAddress, TUseBalancesTokens> = {};
	for (const token of tokens) {
		tokensAsObject[toAddress(token.address)] = token;
	}

	const callAndResult: {
		call: (typeof chunckCalls)[0];
		result: (typeof results)[0];
	}[] = [];
	for (let i = 0; i < chunckCalls.length; i++) {
		const call = chunckCalls[i];
		const result = results[i];
		callAndResult.push({call, result});
	}

	for (const {call, result} of callAndResult) {
		let element = tokensAsObject[toAddress(call.address)];
		if (!element) {
			if (call.functionName === 'getEthBalance') {
				element = tokensAsObject[ethTokenAddress];
			} else {
				continue;
			}
		}

		/******************************************************************************************
		 ** Retrieve the existing data and populate our return object with the existing data if they
		 ** exist, or just populate the object with the default ones
		 ******************************************************************************************/
		const {address, decimals: injectedDecimals, name: injectedName, symbol: injectedSymbol} = element;
		if (!_data[toAddress(address)]) {
			_data[toAddress(address)] = {
				address: address,
				name: injectedName || '',
				symbol: injectedSymbol || '',
				decimals: injectedDecimals || 0,
				chainID: chainID,
				balance: toNormalizedBN(0n, injectedDecimals || 0),
				value: 0
			};
		}
		const decimals = _data[toAddress(address)].decimals || injectedDecimals || 0;
		const symbol = _data[toAddress(address)].symbol || injectedSymbol || '';
		const name = _data[toAddress(address)].name || injectedName || '';

		/******************************************************************************************
		 ** Based on the type of call, we will populate the data object with the results of the call
		 ** and update the TOKEN_UPDATE object with the new data.
		 ******************************************************************************************/
		const network = config.chains.find(chain => chain.id === chainID);
		if (call.functionName === 'name') {
			if (name === undefined || name === '') {
				if (isEthAddress(address)) {
					_data[toAddress(address)].name = network?.nativeCurrency?.name || '';
				} else {
					_data[toAddress(address)].name = decodeAsString(result) || name;
				}
			}
		} else if (call.functionName === 'symbol') {
			if (symbol === undefined || symbol === '') {
				if (isEthAddress(address)) {
					_data[toAddress(address)].symbol = network?.nativeCurrency?.symbol || '';
				} else {
					_data[toAddress(address)].symbol = decodeAsString(result) || symbol;
				}
			}
		} else if (call.functionName === 'decimals') {
			if (decimals === undefined || decimals === 0) {
				if (isEthAddress(address)) {
					_data[toAddress(address)].decimals = network?.nativeCurrency?.decimals || 0;
				} else {
					_data[toAddress(address)].decimals = decodeAsNumber(result) || decimals;
				}
			}
		} else if (call.functionName === 'balanceOf' && hasOwnerAddress) {
			const balanceOf = decodeAsBigInt(result);
			_data[toAddress(address)].balance = toNormalizedBN(balanceOf, decimals);
		} else if (call.functionName === 'getEthBalance' && hasOwnerAddress) {
			const balanceOf = decodeAsBigInt(result);
			_data[toAddress(address)].balance = toNormalizedBN(balanceOf, decimals);
		}

		if (_data[toAddress(address)].decimals === 0) {
			_data[toAddress(address)].decimals = 18;
		}
		/******************************************************************************************
		 ** Store the last update and the owner address for the token in the TOKEN_UPDATE object.
		 ** This will be used to skip fetching the same token for the same owner in the next 60s.
		 ******************************************************************************************/
		TOKEN_UPDATE[`${chainID}/${toAddress(address)}`] = {
			..._data[toAddress(address)],
			owner: toAddress(ownerAddress),
			lastUpdate: Date.now()
		};
	}

	return [_data, undefined];
}

export async function getBalances(
	chainID: number,
	address: TAddress | undefined,
	tokens: TUseBalancesTokens[],
	config: Config,
	shouldForceFetch = false
): Promise<[Record<TAddress, TERC20TokensWithBalance>, Error | undefined]> {
	let result: Record<TAddress, TERC20TokensWithBalance> = {};
	const ownerAddress = address;
	const calls: any[] = [];

	for (const element of tokens) {
		const {address: token} = element;

		const tokenUpdateInfo = TOKEN_UPDATE[`${chainID}/${toAddress(element.address)}`];
		if (tokenUpdateInfo?.lastUpdate && Date.now() - tokenUpdateInfo?.lastUpdate < 60_000 && !shouldForceFetch) {
			if (toAddress(tokenUpdateInfo.owner) === toAddress(ownerAddress)) {
				result[toAddress(token)] = tokenUpdateInfo;
				continue;
			}
		}

		if (isEthAddress(token)) {
			const network = config.chains.find(chain => chain.id === chainID);
			const multicall3Contract = {
				address: network?.contracts?.multicall3?.address || MULTICALL3_ADDRESS,
				abi: AGGREGATE3_ABI
			};
			const baseContract = {address: ethTokenAddress, abi: erc20Abi};
			if (element.decimals === undefined || element.decimals === 0) {
				calls.push({...baseContract, functionName: 'decimals'} as never);
			}
			if (element.symbol === undefined || element.symbol === '') {
				calls.push({...baseContract, functionName: 'symbol'} as never);
			}
			if (element.name === undefined || element.name === '') {
				calls.push({...baseContract, functionName: 'name'} as never);
			}
			if (ownerAddress) {
				calls.push({...multicall3Contract, functionName: 'getEthBalance', args: [ownerAddress]} as never);
			}
		} else {
			const baseContract = {address: token, abi: erc20Abi};
			if (element.decimals === undefined || element.decimals === 0) {
				calls.push({...baseContract, functionName: 'decimals'} as never);
			}
			if (element.symbol === undefined || element.symbol === '') {
				calls.push({...baseContract, functionName: 'symbol'} as never);
			}
			if (element.name === undefined || element.name === '') {
				calls.push({...baseContract, functionName: 'name'} as never);
			}
			if (ownerAddress) {
				calls.push({...baseContract, functionName: 'balanceOf', args: [ownerAddress]} as never);
			}
		}
	}

	try {
		const [callResult] = await performCall(chainID, calls, tokens, toAddress(ownerAddress), config);
		result = {...result, ...callResult};
		return [result, undefined];
	} catch (_error) {
		console.error(_error);
		return [result, _error as Error];
	}
}

/***************************************************************************
 ** This hook can be used to fetch balance information for any ERC20 tokens.
 **************************************************************************/
export function useBalances(props?: TUseBalancesReq): TUseBalancesRes {
	const {address: userAddress} = useAccount();
	const config = useConfig();
	const [status, setStatus] = useState<TDefaultStatus>(defaultStatus);
	const [someStatus, setSomeStatus] = useState<TDefaultStatus>(defaultStatus);
	const [updateStatus, setUpdateStatus] = useState<TDefaultStatus>(defaultStatus);
	const [error, setError] = useState<Error | undefined>(undefined);
	const [balances, setBalances] = useState<TChainERC20Tokens>({});
	const [chainStatus, setChainStatus] = useState<TChainStatus>(defaultChainStatus);
	const data = useRef<TDataRef>({nonce: 0, address: toAddress(), balances: {}});
	const stringifiedTokens = useMemo((): string => {
		const supportedNetworks = config.chains.map(({id}) => id);
		const tokens = props?.tokens || [];
		const supportedTokens = tokens.filter(({chainID}) => supportedNetworks.includes(chainID));
		return serialize(supportedTokens);
	}, [props?.tokens, config.chains]);
	const currentlyConnectedAddress = useRef<TAddress | undefined>(undefined);
	const currentIdentifier = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (toAddress(userAddress) !== toAddress(currentlyConnectedAddress.current)) {
			currentlyConnectedAddress.current = toAddress(userAddress);
			setBalances({});
			data.current = {
				address: toAddress(userAddress),
				balances: {},
				nonce: 0
			};
			const resetChainStatus: TChainStatus = defaultChainStatus;
			for (const network of config.chains) {
				resetChainStatus.chainLoadingStatus[network.id] = true;
				resetChainStatus.chainSuccessStatus[network.id] = false;
				resetChainStatus.chainErrorStatus[network.id] = false;
			}
			setStatus({...defaultStatus, isLoading: true});
			setChainStatus(resetChainStatus);
		}
	}, [userAddress, config]);

	const updateBalancesCall = useCallback(
		(
			currentUserAddress: TAddress,
			chainID: number,
			newRawData: Record<TAddress, TERC20TokensWithBalance>
		): TChainERC20Tokens => {
			if (currentlyConnectedAddress.current !== currentUserAddress) {
				return {};
			}

			if (toAddress(currentUserAddress) !== toAddress(data?.current?.address)) {
				data.current = {
					address: toAddress(currentUserAddress),
					balances: {},
					nonce: 0
				};
			}
			data.current.address = toAddress(currentUserAddress);

			for (const [address, element] of Object.entries(newRawData)) {
				if (!data.current.balances[chainID]) {
					data.current.balances[chainID] = {};
				}
				data.current.balances[chainID][toAddress(address)] = {
					...data.current.balances[chainID][toAddress(address)],
					...element
				};
			}
			data.current.nonce += 1;

			setBalances((b): TChainERC20Tokens => {
				return {
					...b,
					[chainID]: {
						...(b[chainID] || {}),
						...data.current.balances[chainID]
					}
				};
			});
			return data.current.balances;
		},
		[]
	);

	/***************************************************************************
	 ** onUpdate will take the stringified tokens and fetch the balances for each
	 ** token. It will then update the balances state with the new balances.
	 ** This takes the whole list and is not optimized for performance, aka not
	 ** send in a worker.
	 **************************************************************************/
	const onUpdate = useCallback(
		async (shouldForceFetch?: boolean): Promise<TChainERC20Tokens> => {
			const tokenList = (deserialize(stringifiedTokens) || []) as TUseBalancesTokens[];
			const tokens = tokenList.filter(({address}: TUseBalancesTokens): boolean => !isZeroAddress(address));
			if (tokens.length === 0) {
				return {};
			}
			setUpdateStatus({...defaultStatus, isLoading: true});

			const tokensPerChainID: Record<number, TUseBalancesTokens[]> = {};
			const alreadyAdded: Record<number, Record<TAddress, boolean>> = {};
			for (const token of tokens) {
				if (!tokensPerChainID[token.chainID]) {
					tokensPerChainID[token.chainID] = [];
				}
				if (!alreadyAdded[token.chainID]) {
					alreadyAdded[token.chainID] = {};
				}
				if (alreadyAdded[token.chainID][toAddress(token.address)]) {
					continue;
				}
				tokensPerChainID[token.chainID].push(token);
				alreadyAdded[token.chainID][toAddress(token.address)] = true;
			}

			const updated: TChainERC20Tokens = {};
			const chainIDs = config.chains.map(({id}) => id);
			for (const [chainIDStr, tokens] of Object.entries(tokensPerChainID)) {
				const chainID = Number(chainIDStr);
				if (!chainIDs.includes(chainID)) {
					continue;
				}

				const chunks = [];
				for (let i = 0; i < tokens.length; i += 200) {
					chunks.push(tokens.slice(i, i + 200));
				}

				for (const chunkTokens of chunks) {
					const [newRawData, err] = await getBalances(
						chainID || 1,
						userAddress,
						chunkTokens,
						config,
						shouldForceFetch
					);
					if (err) {
						setError(err as Error);
					}

					if (toAddress(userAddress) !== data?.current?.address) {
						data.current = {
							address: toAddress(userAddress),
							balances: {},
							nonce: 0
						};
					}
					data.current.address = toAddress(userAddress);
					for (const [address, element] of Object.entries(newRawData)) {
						if (!updated[chainID]) {
							updated[chainID] = {};
						}
						updated[chainID][toAddress(address)] = element;

						if (!data.current.balances[chainID]) {
							data.current.balances[chainID] = {};
						}
						data.current.balances[chainID][toAddress(address)] = {
							...data.current.balances[chainID][toAddress(address)],
							...element
						};
					}
					data.current.nonce += 1;
				}

				setBalances(
					(b): TChainERC20Tokens => ({
						...b,
						[chainID]: {
							...(b[chainID] || {}),
							...data.current.balances[chainID]
						}
					})
				);
				setUpdateStatus({...defaultStatus, isSuccess: true});
			}

			return updated;
		},
		[stringifiedTokens, userAddress, config]
	);

	/***************************************************************************
	 ** onUpdateSome takes a list of tokens and fetches the balances for each
	 ** token. Even if it's not optimized for performance, it should not be an
	 ** issue as it should only be used for a little list of tokens.
	 **************************************************************************/
	const onUpdateSome = useCallback(
		async (tokenList: TUseBalancesTokens[], shouldForceFetch?: boolean): Promise<TChainERC20Tokens> => {
			setSomeStatus({...defaultStatus, isLoading: true});
			const chains: number[] = [];
			const tokens = tokenList.filter(({address}: TUseBalancesTokens): boolean => !isZeroAddress(address));
			const tokensPerChainID: Record<number, TUseBalancesTokens[]> = {};
			const alreadyAdded: Record<number, Record<TAddress, boolean>> = {};

			for (const token of tokens) {
				if (!tokensPerChainID[token.chainID]) {
					tokensPerChainID[token.chainID] = [];
				}
				if (!alreadyAdded[token.chainID]) {
					alreadyAdded[token.chainID] = {};
				}
				if (alreadyAdded[token.chainID][toAddress(token.address)]) {
					continue;
				}

				tokensPerChainID[token.chainID].push(token);
				alreadyAdded[token.chainID][toAddress(token.address)] = true;
				if (!chains.includes(token.chainID)) {
					chains.push(token.chainID);
				}
			}

			const updated: TChainERC20Tokens = {};
			const chainIDs = config.chains.map(({id}) => id);
			for (const [chainIDStr, tokens] of Object.entries(tokensPerChainID)) {
				const chainID = Number(chainIDStr);
				if (!chainIDs.includes(chainID)) {
					continue;
				}

				const chunks = [];
				for (let i = 0; i < tokens.length; i += 200) {
					chunks.push(tokens.slice(i, i + 200));
				}
				for (const chunkTokens of chunks) {
					const [newRawData, err] = await getBalances(
						chainID || 1,
						toAddress(userAddress),
						chunkTokens,
						config,
						shouldForceFetch
					);
					if (err) {
						setError(err as Error);
					}
					if (toAddress(userAddress) !== data?.current?.address) {
						data.current = {
							address: toAddress(userAddress),
							balances: {},
							nonce: 0
						};
					}
					data.current.address = toAddress(userAddress);

					for (const [address, element] of Object.entries(newRawData)) {
						if (!updated[chainID]) {
							updated[chainID] = {};
						}
						updated[chainID][toAddress(address)] = element;

						if (!data.current.balances[chainID]) {
							data.current.balances[chainID] = {};
						}
						data.current.balances[chainID][toAddress(address)] = {
							...data.current.balances[chainID][toAddress(address)],
							...element
						};
					}
					data.current.nonce += 1;
				}
			}

			setBalances(previous => {
				const updated = {...previous};
				for (const [chainID, chainData] of Object.entries(data.current.balances)) {
					updated[Number(chainID)] = {...updated[Number(chainID)], ...chainData};
				}
				return updated;
			});
			setSomeStatus({...defaultStatus, isSuccess: true});
			return updated;
		},
		[userAddress, config]
	);

	/***************************************************************************
	 ** Everytime the stringifiedTokens change, we need to update the balances.
	 ** This is the main hook and is optimized for performance, using a worker
	 ** to fetch the balances, preventing the UI to freeze.
	 **************************************************************************/
	useAsyncTrigger(async (): Promise<void> => {
		setStatus({...defaultStatus, isLoading: true});

		/******************************************************************************************
		 ** Everytime this function is re-triggered, we will create a unique identifier based on
		 ** the stringified tokens and the user address. This will allow us to prevent multiple
		 ** final setState that might jump the UI.
		 *****************************************************************************************/
		const identifier = createUniqueID(serialize({stringifiedTokens, userAddress}));
		currentIdentifier.current = identifier;

		const tokens = (JSON.parse(stringifiedTokens) || []) as TUseBalancesTokens[];
		const tokensPerChainID: Record<number, TUseBalancesTokens[]> = {};
		const alreadyAdded: Record<number, Record<TAddress, boolean>> = {};
		for (const token of tokens) {
			if (!tokensPerChainID[token.chainID]) {
				tokensPerChainID[token.chainID] = [];
			}
			if (!alreadyAdded[token.chainID]) {
				alreadyAdded[token.chainID] = {};
			}
			if (alreadyAdded[token.chainID][toAddress(token.address)]) {
				continue;
			}
			tokensPerChainID[token.chainID].push(token);
			alreadyAdded[token.chainID][toAddress(token.address)] = true;
		}

		if (props?.priorityChainID) {
			const chainID = props.priorityChainID;
			setChainStatus(prev => ({
				chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: true},
				chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: false},
				chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
			}));

			const tokens = tokensPerChainID[chainID] || [];
			if (tokens.length > 0) {
				const chunks = [];
				for (let i = 0; i < tokens.length; i += 200) {
					chunks.push(tokens.slice(i, i + 200));
				}
				const allPromises = [];
				for (const chunkTokens of chunks) {
					allPromises.push(
						getBalances(chainID, userAddress, chunkTokens, config).then(
							async ([newRawData, err]): Promise<void> => {
								updateBalancesCall(toAddress(userAddress), chainID, newRawData);
								setError(err);
							}
						)
					);
				}
				await Promise.all(allPromises);
				if (currentIdentifier.current === identifier) {
					setChainStatus(prev => ({
						chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: false},
						chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: true},
						chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
					}));
				}
			}
		}

		if (SHOULD_FETCH_ALL_CHAINS) {
			const chainIDs = config.chains.map(({id}) => id);
			for (const [chainIDStr, tokens] of Object.entries(tokensPerChainID)) {
				const chainID = Number(chainIDStr);
				if (!chainIDs.includes(chainID)) {
					continue;
				}
				if (props?.priorityChainID && chainID === props.priorityChainID) {
					continue;
				}
				setChainStatus(prev => ({
					chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: true},
					chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: false},
					chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
				}));

				const chunks = [];
				for (let i = 0; i < tokens.length; i += 200) {
					chunks.push(tokens.slice(i, i + 200));
				}
				const allPromises = [];
				for (const chunkTokens of chunks) {
					allPromises.push(
						getBalances(chainID, userAddress, chunkTokens, config).then(
							async ([newRawData, err]): Promise<void> => {
								updateBalancesCall(toAddress(userAddress), chainID, newRawData);
								setError(err);
							}
						)
					);
				}
				await Promise.all(allPromises);
				if (currentIdentifier.current === identifier) {
					setChainStatus(prev => ({
						chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: false},
						chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: true},
						chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
					}));
				}
			}
		} else {
			if (props?.priorityChainID) {
				// Do nothing, already done
			} else {
				const chainID = config.state.chainId;
				setChainStatus(prev => ({
					chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: true},
					chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: false},
					chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
				}));

				const tokens = tokensPerChainID[chainID] || [];
				if (tokens.length > 0) {
					const chunks = [];
					for (let i = 0; i < tokens.length; i += 200) {
						chunks.push(tokens.slice(i, i + 200));
					}
					const allPromises = [];
					for (const chunkTokens of chunks) {
						allPromises.push(
							getBalances(chainID, userAddress, chunkTokens, config).then(
								async ([newRawData, err]): Promise<void> => {
									updateBalancesCall(toAddress(userAddress), chainID, newRawData);
									setError(err);
								}
							)
						);
					}
					await Promise.all(allPromises);
					if (currentIdentifier.current === identifier) {
						setChainStatus(prev => ({
							chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: false},
							chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: true},
							chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
						}));
					}
				}
			}
		}

		/******************************************************************************************
		 ** If the current identifier is the same as the one we created, we can set the status to
		 ** success and fetched. This will prevent the UI to jump if the user changes the tokens
		 ** or the address.
		 *****************************************************************************************/
		if (currentIdentifier.current === identifier) {
			setStatus({...defaultStatus, isSuccess: true});
		}
	}, [stringifiedTokens, userAddress, updateBalancesCall, props?.priorityChainID, config]);

	const onUpdateTokensForChain = useCallback(
		async (chainID: number): Promise<void> => {
			const allTokens = (JSON.parse(stringifiedTokens) || []) as TUseBalancesTokens[];
			const tokensPerChainID: Record<number, TUseBalancesTokens[]> = {};
			const alreadyAdded: Record<number, Record<TAddress, boolean>> = {};
			for (const token of allTokens) {
				if (!tokensPerChainID[token.chainID]) {
					tokensPerChainID[token.chainID] = [];
				}
				if (!alreadyAdded[token.chainID]) {
					alreadyAdded[token.chainID] = {};
				}
				if (alreadyAdded[token.chainID][toAddress(token.address)]) {
					continue;
				}
				tokensPerChainID[token.chainID].push(token);
				alreadyAdded[token.chainID][toAddress(token.address)] = true;
			}

			setChainStatus(prev => ({
				chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: true},
				chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: false},
				chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
			}));

			const tokens = tokensPerChainID[chainID] || [];
			if (tokens.length > 0) {
				const chunks = [];
				for (let i = 0; i < tokens.length; i += 200) {
					chunks.push(tokens.slice(i, i + 200));
				}
				const allPromises = [];
				for (const chunkTokens of chunks) {
					allPromises.push(
						getBalances(chainID, userAddress, chunkTokens, config).then(
							async ([newRawData, err]): Promise<void> => {
								updateBalancesCall(toAddress(userAddress), chainID, newRawData);
								setError(err);
							}
						)
					);
				}
				await Promise.all(allPromises);
				setChainStatus(prev => ({
					chainLoadingStatus: {...(prev?.chainLoadingStatus || {}), [chainID]: false},
					chainSuccessStatus: {...(prev?.chainSuccessStatus || {}), [chainID]: true},
					chainErrorStatus: {...(prev?.chainErrorStatus || {}), [chainID]: false}
				}));
			}
		},
		[stringifiedTokens, userAddress, updateBalancesCall, config]
	);

	const contextValue = useDeepCompareMemo(
		(): TUseBalancesRes => ({
			data: balances || {},
			onUpdate: onUpdate,
			onUpdateSome: onUpdateSome,
			onUpdateTokensForChain,
			error,
			isLoading: status.isLoading || someStatus.isLoading || updateStatus.isLoading,
			isSuccess: status.isSuccess && someStatus.isSuccess && updateStatus.isSuccess,
			isError: status.isError || someStatus.isError || updateStatus.isError,
			chainErrorStatus: chainStatus.chainErrorStatus,
			chainLoadingStatus: chainStatus.chainLoadingStatus,
			chainSuccessStatus: chainStatus.chainSuccessStatus,
			status:
				status.isError || someStatus.isError || updateStatus.isError
					? 'error'
					: status.isLoading || someStatus.isLoading || updateStatus.isLoading
						? 'loading'
						: status.isSuccess && someStatus.isSuccess && updateStatus.isSuccess
							? 'success'
							: 'unknown'
		}),
		[
			balances,
			error,
			onUpdate,
			onUpdateSome,
			onUpdateTokensForChain,
			someStatus.isError,
			someStatus.isLoading,
			someStatus.isSuccess,
			status.isError,
			status.isLoading,
			status.isSuccess,
			updateStatus.isError,
			updateStatus.isLoading,
			updateStatus.isSuccess,
			chainStatus.chainErrorStatus,
			chainStatus.chainLoadingStatus,
			chainStatus.chainSuccessStatus
		]
	);

	return contextValue;
}
