import {isAddress} from 'viem';
import axios from 'axios';
import {toAddress} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {getEnsAddress} from '@wagmi/core';
import {assertFulfilled} from '@lib/types/assertType';
import {CHAINS, supportedNetworks} from '@lib/utils/tools.chains';

import type {GetBytecodeReturnType} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';

export type TAddressAndEns = {
	address: TAddress;
	label: string;
};

export type TInputAddressLike = {
	address: TAddress | undefined;
	label: string;
	isValid: boolean | 'undetermined';
	source?: 'typed' | 'addressBook' | 'defaultValue' | 'autoPopulate';
	error?: string;
};
export const defaultInputAddressLike: TInputAddressLike = {
	address: undefined,
	label: '',
	error: '',
	isValid: 'undetermined',
	source: 'typed'
};
async function getBytecodeAsync(networkId: number, address: TAddress): Promise<GetBytecodeReturnType> {
	const publicClient = getClient(networkId);
	return publicClient.getBytecode({address});
}

async function getIsGnosisAddress(chainId: number, address: TAddress): Promise<boolean> {
	const safeAPI = CHAINS[chainId]?.safeAPIURI || '';

	if (safeAPI) {
		try {
			const {data} = await axios.get(`${safeAPI}/api/v1/safes/${address}/creation/`);
			if (data.creator) {
				return !!data.creator;
			}
			return false;
		} catch (error) {
			return false;
		}
	}
	return false;
}

export async function getIsSmartContract({
	address,
	chainId,
	checkAllNetworks = false
}: {
	address: TAddress;
	chainId: number;
	checkAllNetworks?: boolean;
}): Promise<boolean> {
	try {
		if (checkAllNetworks) {
			const promisesArray = supportedNetworks.map(network => ({
				network,
				promise: getBytecodeAsync(network.id, address)
			}));
			const promisesSettled = await Promise.allSettled(
				promisesArray.map(async ({promise, network}) => {
					return {bytecode: await promise, network: network.id};
				})
			);
			const bytecodeWithNetwork = promisesSettled.filter(assertFulfilled).find(item => item.value)?.value;
			const {bytecode, network} = bytecodeWithNetwork || {};
			const isGnosisAddress = bytecode && network ? await getIsGnosisAddress(network, address) : false;
			return isGnosisAddress ? false : Boolean(bytecode);
		}

		const bytecode = await getBytecodeAsync(chainId, address);
		const isGnosisAddress = bytecode ? await getIsGnosisAddress(chainId, address) : false;

		return isGnosisAddress ? false : Boolean(bytecode);
	} catch (error) {
		return false;
	}
}

export async function getAddressAndEns(address: string, chainID: number): Promise<TAddressAndEns | undefined> {
	if (isAddress(address)) {
		const ensName = await getClient(1).getEnsName({address});
		return {address: toAddress(address), label: ensName ?? ''};
	}
	if (address.endsWith('.eth')) {
		const receiverAddress = toAddress(await getEnsAddress(retrieveConfig(), {name: address, chainId: chainID}));

		return isAddress(receiverAddress) ? {address: toAddress(receiverAddress), label: address} : undefined;
	}
	return;
}
