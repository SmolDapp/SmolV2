import {useState} from 'react';
import {mainnet} from 'viem/chains';
import {isAddress, toAddress} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {Clusters} from '@clustersxyz/sdk';
import {getEnsAddress, getEnsName} from '@wagmi/core';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {defaultInputAddressLike} from '@lib/utils/tools.address';

import type {TInputAddressLike} from '@lib/utils/tools.address';

export function useValidateAddressInput(): {
	validate: (signal: AbortSignal | undefined, input: string) => Promise<TInputAddressLike>;
	isCheckingValidity: boolean;
} {
	const {getEntry} = useAddressBook();
	const [isCheckingValidity, set_isCheckingValidity] = useState<boolean>(false);

	const validate = async (signal: AbortSignal | undefined, input: string): Promise<TInputAddressLike> => {
		if (!input || input === '') {
			return defaultInputAddressLike;
		}

		/**********************************************************
		 ** Check if the input is an address from the address book
		 **********************************************************/
		const fromAddressBook = await getEntry({label: input, address: toAddress(input)});
		if (fromAddressBook && !fromAddressBook.isHidden) {
			if (signal?.aborted) {
				throw new Error('Aborted!');
			}

			return {
				address: toAddress(fromAddressBook.address),
				label: fromAddressBook.label,
				isValid: true,
				error: undefined,
				source: 'addressBook'
			};
		}

		/**********************************************************
		 ** Check if the input is an address
		 **********************************************************/
		if (isAddress(input)) {
			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(true);
			const clusters = new Clusters();
			const [ensName, clusterName] = await Promise.all([
				getEnsName(retrieveConfig(), {address: toAddress(input), chainId: mainnet.id}),
				clusters.getName(toAddress(input))
			]);

			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(false);

			return {
				address: toAddress(input),
				label: ensName || clusterName || toAddress(input),
				error: undefined,
				isValid: true,
				source: 'typed'
			};
		}

		/******************************************************************************************
		 ** Check if the input is an ENS and handle it by checking if it resolves to an address
		 *****************************************************************************************/
		const lowercaseInput = input.toLowerCase();
		if (lowercaseInput.endsWith('.eth')) {
			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(true);
			const ensAddress = await getEnsAddress(retrieveConfig(), {name: lowercaseInput, chainId: mainnet.id});

			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(false);

			if (ensAddress) {
				return {
					address: toAddress(ensAddress),
					label: lowercaseInput || toAddress(ensAddress),
					error: undefined,
					isValid: true,
					source: 'typed'
				};
			}
		}

		/******************************************************************************************
		 ** Check if the input is a clusters handle by checking if it ends with `/`
		 *****************************************************************************************/
		if (lowercaseInput.endsWith('/') || lowercaseInput.includes('/')) {
			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(true);
			const clusters = new Clusters();
			const clusterAddress = await clusters.getAddress(lowercaseInput);
			if (signal?.aborted) {
				throw new Error('Aborted!');
			}
			set_isCheckingValidity(false);

			if (clusterAddress && clusterAddress?.type === 'evm' && isAddress(clusterAddress.address)) {
				return {
					address: toAddress(clusterAddress.address),
					label: lowercaseInput || clusterAddress.name || toAddress(clusterAddress.address),
					error: undefined,
					isValid: true,
					source: 'typed'
				};
			}
		}

		return {
			address: undefined,
			label: input,
			isValid: false,
			error: 'This address looks invalid',
			source: 'typed'
		};
	};

	return {isCheckingValidity, validate};
}
