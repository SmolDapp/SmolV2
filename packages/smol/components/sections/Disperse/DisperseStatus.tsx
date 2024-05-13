import {type ReactElement, useMemo, useState} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {isAddress, toAddress} from '@builtbymom/web3/utils';
import {Warning} from '@lib/common/Warning';
import {useAddressBook} from '@lib/contexts/useAddressBook';

import {useDisperse} from './useDisperse';

import type {TAddress} from '@builtbymom/web3/types';
import type {TWarningType} from '@lib/common/Warning';

export function DisperseStatus(): ReactElement | null {
	const {configuration} = useDisperse();
	const {getCachedEntry} = useAddressBook();
	const {getBalance} = useWallet();
	const [status, set_status] = useState<{type: TWarningType; message: string | ReactElement}[]>([]);

	const addresses = useMemo(
		() => configuration.inputs.map(input => input.receiver.address).filter(Boolean),
		[configuration.inputs]
	);

	const listDuplicates = useMemo(() => {
		// Check if two addresses are the same and list the duplicates
		const allDuplicates = configuration.inputs.reduce((acc, currentRow) => {
			const duplicates = configuration.inputs.reduce((acc, iteratedRow) => {
				if (
					isAddress(currentRow.receiver.address) &&
					isAddress(iteratedRow.receiver.address) &&
					currentRow.UUID !== iteratedRow.UUID &&
					currentRow.receiver.address === iteratedRow.receiver.address
				) {
					acc.push(toAddress(currentRow?.receiver?.address));
				}
				return acc;
			}, [] as TAddress[]);
			return acc.concat(duplicates);
		}, [] as TAddress[]);

		//Remove duplicates from the list
		const allDuplicatesSet = Array.from(new Set(allDuplicates));
		return allDuplicatesSet.length > 0 ? allDuplicatesSet.join(', ') : undefined;
	}, [configuration.inputs]);

	const totalToDisperse = useMemo((): bigint => {
		return configuration.inputs.reduce((acc, row): bigint => acc + row.value.normalizedBigAmount.raw, 0n);
	}, [configuration.inputs]);

	const isAboveBalance =
		totalToDisperse >
		getBalance({
			address: toAddress(configuration.tokenToSend?.address),
			chainID: Number(configuration.tokenToSend?.chainID)
		}).raw;

	useAsyncTrigger(async (): Promise<void> => {
		const allStatus: {type: TWarningType; message: string | ReactElement}[] = [];
		if (addresses.some(address => !getCachedEntry({address}))) {
			allStatus.push({
				message:
					"It's the first time you are sending tokens to some addresses on this lists. Make sure that's what you want to do",
				type: 'warning'
			});
		}
		if (listDuplicates) {
			allStatus.push({
				message: (
					<>
						{
							'Some duplicates were found in the configuration, please check that all the receivers are different addresses: \n'
						}
						<span className={'font-mono'}>{listDuplicates}</span>
					</>
				),
				type: 'error'
			});
		}

		if (isAboveBalance && configuration.tokenToSend) {
			allStatus.push({
				message: 'Total amount to disperse exceeds the account balance',
				type: 'error'
			});
		}

		set_status(allStatus);
	}, [addresses, configuration.tokenToSend, getCachedEntry, isAboveBalance, listDuplicates]);

	if (!status) {
		return null;
	}

	return (
		<div className={'mb-4 grid gap-2'}>
			{status.map((status, index) => (
				<Warning
					key={index}
					message={status.message}
					type={status.type}
				/>
			))}
		</div>
	);
}
