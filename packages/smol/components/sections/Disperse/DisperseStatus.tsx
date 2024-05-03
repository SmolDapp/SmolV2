import {type ReactElement, useMemo} from 'react';
import {Warning} from 'packages/lib/common/Warning';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {isAddress, toAddress} from '@builtbymom/web3/utils';
import {useAddressBook} from '@contexts/useAddressBook';

import {useDisperse} from './useDisperse';

import type {TWarningType} from 'packages/lib/common/Warning';

export function DisperseStatus(): ReactElement | null {
	const {configuration} = useDisperse();
	const {getCachedEntry} = useAddressBook();
	const {getBalance} = useWallet();

	const addresses = configuration.inputs.map(input => input.receiver.address).filter(Boolean);

	const totalToDisperse = useMemo((): bigint => {
		return configuration.inputs.reduce((acc, row): bigint => acc + row.value.normalizedBigAmount.raw, 0n);
	}, [configuration.inputs]);

	const isAboveBalance =
		totalToDisperse >
		getBalance({
			address: toAddress(configuration.tokenToSend?.address),
			chainID: Number(configuration.tokenToSend?.chainID)
		}).raw;

	const status: {type: TWarningType; message: string | ReactElement} | null = useMemo(() => {
		if (addresses.some(address => !getCachedEntry({address}))) {
			return {
				message:
					"It's the first time you are sending tokens to some addresses on this lists. Make sure that's what you want to do",
				type: 'warning'
			};
		}
		if (
			configuration.inputs.some(currentRow =>
				configuration.inputs.find(
					iteratedRow =>
						isAddress(currentRow.receiver.address) &&
						isAddress(iteratedRow.receiver.address) &&
						currentRow.UUID !== iteratedRow.UUID &&
						currentRow.receiver.address === iteratedRow.receiver.address
				)
			)
		) {
			return {
				message:
					'Some duplicates were found in the configuration, please check that all the receivers are different',
				type: 'error'
			};
		}

		if (isAboveBalance) {
			return {
				message: 'Total amount to disperse exceeds the account balance',
				type: 'error'
			};
		}

		return null;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [addresses, configuration.inputs.length, getCachedEntry]);

	if (!status) {
		return null;
	}

	return (
		<div className={'mb-4'}>
			<Warning
				message={status.message}
				type={status.type}
			/>
		</div>
	);
}
