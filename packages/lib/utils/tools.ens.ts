import {isAddress} from 'viem';
import {toAddress} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {getEnsAddress} from '@wagmi/core';

import type {TAddress} from '@builtbymom/web3/types';

export async function checkENSValidity(ens: string): Promise<[TAddress, boolean]> {
	try {
		const resolvedAddress = await getEnsAddress(retrieveConfig(), {name: ens.toLocaleLowerCase(), chainId: 1});
		if (resolvedAddress) {
			if (isAddress(resolvedAddress)) {
				return [toAddress(resolvedAddress), true];
			}
		}
		return [toAddress(), false];
	} catch (error) {
		return [toAddress(), false];
	}
}
