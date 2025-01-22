import {isAddress, toAddress} from 'lib/utils/tools.addresses';
import {useEffect, useMemo, useState} from 'react';

import {Warning} from 'packages/smol/common/Warning';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {TInputAddressLikeWithUUID} from 'packages/smol/app/(apps)/multisafe/contexts/useMultisafe';
import type {TWarningType} from 'packages/smol/common/Warning';
import type {ReactElement} from 'react';

export function ConfigurationStatus(props: {
	owners: TInputAddressLikeWithUUID[];
	threshold: number;
}): ReactElement | null {
	const [status, setStatus] = useState<{type: TWarningType; message: string | ReactElement}[]>([]);
	const addresses = useMemo(() => props.owners.map(input => input.address).filter(Boolean), [props.owners]);

	const listDuplicates = useMemo(() => {
		// Check if two addresses are the same and list the duplicates
		const allDuplicates = props.owners.reduce((acc, currentRow) => {
			const duplicates = props.owners.reduce((acc, iteratedRow) => {
				if (
					isAddress(currentRow.address) &&
					isAddress(iteratedRow.address) &&
					currentRow.UUID !== iteratedRow.UUID &&
					currentRow.address === iteratedRow.address
				) {
					acc.push(toAddress(currentRow?.address));
				}
				return acc;
			}, [] as TAddress[]);
			return acc.concat(duplicates);
		}, [] as TAddress[]);

		//Remove duplicates from the list
		const allDuplicatesSet = Array.from(new Set(allDuplicates));
		return allDuplicatesSet.length > 0 ? allDuplicatesSet.join(', ') : undefined;
	}, [props.owners]);

	useEffect((): void => {
		const allStatus: {type: TWarningType; message: string | ReactElement}[] = [];
		if (addresses.some(address => !isAddress(address))) {
			allStatus.push({
				message: 'Some addresses are invalid',
				type: 'error'
			});
		}
		if (props.owners.length <= 1) {
			allStatus.push({
				message:
					'We recommend to have at least two owners in your Safe.\nYou can use any other wallet or even the Safe app on your phone as another owner.',
				type: 'warning'
			});
		}
		if (props.threshold > props.owners.length) {
			allStatus.push({
				message: 'The threshold should be less than or equal to the number of owners.',
				type: 'error'
			});
		}
		if (listDuplicates) {
			allStatus.push({
				message: (
					<>
						{
							'Some duplicates were found in the configuration, please check that all the owners are different addresses: \n'
						}
						<span className={'font-mono'}>{listDuplicates}</span>
					</>
				),
				type: 'error'
			});
		}

		setStatus(allStatus);
	}, [addresses, props.owners.length, listDuplicates, props.threshold]);

	if (!status || status.length === 0) {
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
