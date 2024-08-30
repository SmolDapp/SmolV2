import React, {memo, useCallback, useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {usePlausible} from 'next-plausible';
import Papa from 'papaparse';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, isAddress, toAddress} from '@builtbymom/web3/utils';
import {SmolTokenSelector} from '@lib/common/SmolTokenSelector';
import {usePrices} from '@lib/contexts/usePrices';
import {useValidateAddressInput} from '@lib/hooks/useValidateAddressInput';
import {useValidateAmountInput} from '@lib/hooks/useValidateAmountInput';
import {IconFile} from '@lib/icons/IconFile';
import {IconImport} from '@lib/icons/IconImport';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';

import {DisperseAddressAndAmountInputs} from './DisperseAddressAndAmountInputs';
import {DisperseStatus} from './DisperseStatus';
import {useDisperse} from './useDisperse';
import {newDisperseVoidRow} from './useDisperse.helpers';
import {useDisperseQueryManagement} from './useDisperseQuery';
import {DisperseWizard} from './Wizard';

import type {ChangeEvent, ComponentPropsWithoutRef, ReactElement} from 'react';
import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';
import type {TDisperseInput} from '@lib/types/app.disperse';
import type {TInputAddressLike} from '@lib/utils/tools.address';

function ImportConfigurationButton(): ReactElement {
	const plausible = usePlausible();
	const {configuration, dispatchConfiguration} = useDisperse();
	const {validate: validateAmount} = useValidateAmountInput();

	const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
		if (!e.target.files) {
			return;
		}
		const [file] = e.target.files as unknown as Blob[];
		const reader = new FileReader();
		reader.onload = event => {
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

				/**************************************************************************************
				 ** Process each row to create records
				 *************************************************************************************/
				const records: TDisperseInput[] = parsedCSV.data.reduce((acc: TDisperseInput[], row: any) => {
					const address = toAddress(row[receiverAddress]);
					const amount = row[value];

					/**************************************************************************************
					 ** Validate address and amount
					 *************************************************************************************/
					if (isAddress(address) && amount) {
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

						acc.push(record);
					}
					return acc;
				}, []);

				/**************************************************************************************
				 ** Update the state with the new records
				 *************************************************************************************/
				dispatchConfiguration({type: 'PASTE_RECEIVERS', payload: records});
			} else {
				console.error('The file you are trying to upload seems to be broken');
				toast.error('The file you are trying to upload seems to be broken');
			}
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

export function ExportConfigurationButton({
	className,
	title = 'Export Configuration'
}: ComponentPropsWithoutRef<'button'>): ReactElement {
	const {configuration} = useDisperse();
	const plausible = usePlausible();

	const downloadConfiguration = useCallback(async () => {
		plausible(PLAUSIBLE_EVENTS.DISPERSE_DOWNLOAD_CONFIG);
		const receiverEntries = configuration.inputs
			.map(input => ({
				receiverAddress: input.receiver.address,
				value: input.value.normalizedBigAmount.normalized.toString()
			}))
			.filter(entry => entry.value && entry.receiverAddress);

		const csv = Papa.unparse(receiverEntries, {header: true});
		const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		const name = `smol-disperse-${new Date().toISOString().split('T')[0]}.csv`;
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', name);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}, [configuration.inputs, plausible]);

	return (
		<Button
			onClick={downloadConfiguration}
			className={cl(className)}>
			<IconImport className={'mr-2 size-3 rotate-180 text-neutral-900'} />
			{title}
		</Button>
	);
}

const Disperse = memo(function Disperse(): ReactElement {
	const {safeChainID} = useChainID();
	const {configuration, dispatchConfiguration} = useDisperse();
	const {hasInitialInputs} = useDisperseQueryManagement();
	const {getPrice, pricingHash} = usePrices();
	const [price, set_price] = useState<TNormalizedBN | undefined>(undefined);
	const {validate: validateAmount} = useValidateAmountInput();
	const {validate: validateAddress} = useValidateAddressInput();
	const plausible = usePlausible();

	/**********************************************************************************************
	 ** TODO: Add explanation of the downloadFile function
	 *********************************************************************************************/
	const downloadTemplate = async (): Promise<void> => {
		const receiverEntries = [{receiverAddress: '0x10001192576E8079f12d6695b0948C2F41320040', value: '4.20'}];

		const csv = Papa.unparse(receiverEntries, {header: true});
		const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		const name = `smol-disperse-${new Date().toISOString().split('T')[0]}.csv`;
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', name);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	/**********************************************************************************************
	 ** This effect hook will be triggered when the property token, safeChainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!configuration.tokenToSend) {
			return;
		}
		set_price(getPrice(configuration.tokenToSend));
	}, [configuration.tokenToSend, safeChainID, pricingHash, getPrice]);

	/**********************************************************************************************
	 ** TODO: Add explanation of the onSelectToken function
	 *********************************************************************************************/
	const onSelectToken = (token: TToken | undefined): void => {
		dispatchConfiguration({type: 'SET_TOKEN_TO_SEND', payload: token});
	};

	/**********************************************************************************************
	 ** TODO: Add explanation of the onAddReceivers function
	 *********************************************************************************************/
	const onAddReceivers = (amount: number): void => {
		dispatchConfiguration({
			type: 'ADD_RECEIVERS',
			payload: Array(amount)
				.fill(null)
				.map(() => newDisperseVoidRow())
		});
	};

	/**********************************************************************************************
	 ** TODO: Add explanation of this useEffect hook
	 ** Add initial inputs
	 *********************************************************************************************/
	useEffect(() => {
		if (!hasInitialInputs && configuration.inputs.length === 0) {
			onAddReceivers(2);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasInitialInputs]);

	/**********************************************************************************************
	 ** Event listener when the user past something
	 *********************************************************************************************/
	useEffect(() => {
		const handlePaste = async (event: ClipboardEvent): Promise<void> => {
			const {clipboardData} = event;
			if (!clipboardData) {
				return;
			}
			const text = clipboardData.getData('text');
			if (!text) {
				return;
			}

			/**************************************************************************************
			 ** We want to continue ONLY if the content of the clipboard contains a valid pattern.
			 ** The pattern is:
			 ** 1. An address (0x followed by 40 characters)
			 ** 2. A separator character (space, tab, comma, etc)
			 ** 3. A number (integer or float)
			 ** 4. A new line character (optional)
			 ** 5. Repeat from step 1
			 ** If the pattern is not found, we will ignore the content of the clipboard and return
			 ** the function.
			 *************************************************************************************/
			const trimedText = text.trim();
			const pattern =
				/^(0x[a-fA-F0-9]{40})[\s,;]+((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\d+e[+-]?\d+)(?:\r?\n|$)/gm;
			if (!pattern.test(trimedText)) {
				toast.error(
					'Invalid pattern. Please make sure that your clipboard contains a valid pattern: address, amount'
				);
				return;
			}

			/**************************************************************************************
			 ** Split the text into lines and process each line
			 *************************************************************************************/
			const lines = trimedText.split('\n');
			const inputs: TDisperseInput[] = [];
			for (const line of lines) {
				/**********************************************************************************
				 ** Trim the line but preserve internal whitespace
				 *********************************************************************************/
				const trimmedLine = line.trim();
				if (trimmedLine === '') {
					continue;
				}

				/**********************************************************************************
				 ** Extract the address (first 42 characters starting with 0x)
				 *********************************************************************************/
				const addressMatch = trimmedLine.match(/^(0x[a-fA-F0-9]{40})/);
				if (!addressMatch) {
					continue;
				}
				const [theAddress] = addressMatch;

				/**********************************************************************************
				 ** Validate the address
				 *********************************************************************************/
				if (!isAddress(theAddress)) {
					continue;
				}

				/**********************************************************************************
				 ** Extract the amount (everything after the address and any separators)
				 *********************************************************************************/
				const amountPart = trimmedLine.slice(theAddress.length).trim();

				/**********************************************************************************
				 ** Find the first valid number in the remaining part
				 *********************************************************************************/
				const theAmountMatch = amountPart.match(/((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\d+e[+-]?\d+)/i);
				const theAmount = theAmountMatch ? theAmountMatch[0] : '0';
				const parsedAmount = parseFloat(theAmount).toString();

				/**********************************************************************************
				 ** Create the receiver object
				 *********************************************************************************/
				const receiver = toAddress(theAddress);
				const value = {
					receiver: {
						address: toAddress(receiver),
						label: toAddress(receiver),
						error: '',
						isValid: 'undetermined',
						source: 'typed'
					} as TInputAddressLike,
					value: {...newDisperseVoidRow().value, ...validateAmount(parsedAmount, configuration.tokenToSend)},
					UUID: crypto.randomUUID()
				};

				inputs.push(value);
			}
			dispatchConfiguration({type: 'PASTE_RECEIVERS', payload: inputs});
		};

		document.addEventListener('paste', handlePaste);
		return () => {
			document.removeEventListener('paste', handlePaste);
		};
	}, [configuration.inputs, configuration.tokenToSend, dispatchConfiguration, validateAddress, validateAmount]);

	return (
		<div className={'w-full'}>
			<div className={'mb-4 flex flex-wrap gap-2 text-xs'}>
				<ImportConfigurationButton />
				<ExportConfigurationButton className={'!h-8 !text-xs'} />
				<Button
					className={'!h-8 !text-xs'}
					variant={'light'}
					onClick={() => {
						plausible(PLAUSIBLE_EVENTS.DISPERSE_DOWNLOAD_TEMPLATE);
						downloadTemplate();
					}}>
					<IconFile className={'mr-2 size-3'} />
					{'Download Template'}
				</Button>
			</div>
			<div className={'md:max-w-108 mb-6 w-full max-w-full'}>
				<p className={'mb-2 font-medium'}>{'Token'}</p>
				<SmolTokenSelector
					token={configuration.tokenToSend}
					onSelectToken={onSelectToken}
				/>
			</div>
			<div className={'flex flex-col items-start'}>
				<p className={'mb-2 font-medium'}>{'Send to'}</p>
				{configuration.inputs.map(input => (
					<DisperseAddressAndAmountInputs
						key={input.UUID}
						input={input}
						price={price}
					/>
				))}
			</div>
			<div className={'mb-4'}>
				<button
					className={
						'rounded-lg bg-neutral-200 px-5 py-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-300'
					}
					onClick={() => onAddReceivers(1)}>
					{'+ Add receiver'}
				</button>
			</div>
			<DisperseStatus />
			<DisperseWizard />
		</div>
	);
});

export default Disperse;
