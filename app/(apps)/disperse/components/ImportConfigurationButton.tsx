import {usePlausible} from 'next-plausible';
import Papa from 'papaparse';
import React from 'react';
import {toast} from 'react-hot-toast';
import {useChainId, useConfig} from 'wagmi';

import {Button} from '@lib/components/Button';
import {IconImport} from '@lib/components/icons/IconImport';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {useValidateAmountInput} from '@lib/hooks/web3/useValidateAmountInput';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {getAddressAndEns, isAddress, toAddress} from '@lib/utils/tools.addresses';
import {useDisperse} from 'app/(apps)/disperse/contexts/useDisperse';
import {newDisperseVoidRow} from 'app/(apps)/disperse/contexts/useDisperse.helpers';

import type {TAddressAndEns, TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TDisperseInput} from 'app/(apps)/disperse/types';
import type {ChangeEvent, ReactElement} from 'react';

export function ImportConfigurationButton(props: {setIsLoadingReceivers: (value: boolean) => void}): ReactElement {
	const {setIsLoadingReceivers} = props;
	const plausible = usePlausible();
	const chainID = useChainId();
	const config = useConfig();
	const {configuration, dispatchConfiguration} = useDisperse();
	const {validate: validateAmount} = useValidateAmountInput();
	const {getCachedEntry} = useAddressBook();

	const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
		if (!e.target.files) {
			return;
		}
		const [file] = e.target.files as unknown as Blob[];
		const reader = new FileReader();
		setIsLoadingReceivers(true);
		reader.onload = async event => {
			if (!event?.target?.result) {
				return;
			}
			const {result} = event.target;

			/**************************************************************************************
			 ** Parse the CSV file using Papa Parse
			 *************************************************************************************/
			const parsedCSV = Papa.parse(result as string, {
				header: true,
				skipEmptyLines: true
			});

			/**************************************************************************************
			 ** Check if the file is valid
			 *************************************************************************************/
			const isValidFile =
				parsedCSV.data.length > 0 &&
				parsedCSV.meta.fields &&
				parsedCSV.meta.fields.length === 2 &&
				parsedCSV.meta.fields.includes('receiverAddress') &&
				parsedCSV.meta.fields.includes('value');

			if (isValidFile) {
				/**************************************************************************************
				 ** Extract field names
				 *************************************************************************************/
				const [receiverAddress, value] = parsedCSV.meta.fields;

				/**********************************************************************************
				 ** Initialize an empty array for results
				 **********************************************************************************/
				const records: TDisperseInput[] = [];

				/**************************************************************************************
				 ** Process each row to create records
				 *************************************************************************************/
				const {length} = parsedCSV.data;
				for (const row of parsedCSV.data) {
					const address = toAddress(row[receiverAddress]);
					const amount = row[value];
					const cachedEntry = getCachedEntry({address});
					let label = toAddress(row[receiverAddress]) as string;
					if (length < 20) {
						if (cachedEntry?.label) {
							label = cachedEntry.label;
						} else {
							const fromENS = (await getAddressAndEns(
								row[receiverAddress],
								chainID,
								config
							)) as TAddressAndEns;
							if (fromENS?.label) {
								label = fromENS.label;
							}
						}
					} else if (cachedEntry?.label) {
						label = cachedEntry.label;
					}

					/**************************************************************************************
					 ** Validate address and amount
					 *************************************************************************************/
					if (label && isAddress(address) && amount) {
						const parsedAmount = parseFloat(amount).toString();

						const record: TDisperseInput = {
							receiver: {
								address: address,
								label: label
							} as TInputAddressLike,
							value: {
								...newDisperseVoidRow().value,
								...validateAmount(parsedAmount, configuration.tokenToSend)
							},
							UUID: crypto.randomUUID()
						};
						records.push(record);
					} else if (isAddress(address) && amount) {
						const parsedAmount = parseFloat(amount).toString();

						const record: TDisperseInput = {
							receiver: {
								address: toAddress(address),
								label: toAddress(address)
							} as TInputAddressLike,
							value: {
								...newDisperseVoidRow().value,
								...validateAmount(parsedAmount, configuration.tokenToSend)
							},
							UUID: crypto.randomUUID()
						};
						records.push(record);
					}
				}
				dispatchConfiguration({type: 'PASTE_RECEIVERS', payload: records});
			} else {
				console.error('The file you are trying to upload seems to be broken');
				toast.error('The file you are trying to upload seems to be broken');
			}
			setIsLoadingReceivers(false);
		};
		reader.readAsText(file);
	};

	return (
		<Button
			onClick={() => {
				plausible(PLAUSIBLE_EVENTS.DISPERSE_IMPORT_CONFIG);
				document.querySelector<HTMLInputElement>('#file-upload')?.click();
			}}
			className={'!h-8 py-1.5 !text-xs'}>
			<input
				id={'file-upload'}
				tabIndex={-1}
				className={'absolute inset-0 !cursor-pointer opacity-0'}
				type={'file'}
				accept={'.csv'}
				onClick={event => event.stopPropagation()}
				onChange={handleFileUpload}
			/>
			<IconImport className={'mr-2 size-3 text-neutral-900'} />
			{'Import Configuration'}
		</Button>
	);
}
