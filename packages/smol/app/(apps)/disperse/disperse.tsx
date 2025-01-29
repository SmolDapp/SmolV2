'use client';

import {IconFile} from '@lib/icons/IconFile';
import {IconLoader} from '@lib/icons/IconLoader';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {getAddressAndEns, isAddress, toAddress} from '@lib/utils/tools.addresses';
import {getEnsName} from '@wagmi/core';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import Papa from 'papaparse';
import React, {memo, useCallback, useEffect, useState} from 'react';
import {toast} from 'react-hot-toast';
import {mainnet} from 'viem/chains';
import {useChainId, useConfig} from 'wagmi';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {usePrices} from '@smolContexts/WithPrices/WithPrices';
import {useValidateAddressInput} from '@smolHooks/web3/useValidateAddressInput';
import {useValidateAmountInput} from '@smolHooks/web3/useValidateAmountInput';
import {DisperseAddressAndAmountInputs} from 'packages/smol/app/(apps)/disperse/components/DisperseAddressAndAmountInputs';
import {DisperseStatus} from 'packages/smol/app/(apps)/disperse/components/DisperseStatus';
import {ExportConfigurationButton} from 'packages/smol/app/(apps)/disperse/components/ExportConfigurationButton';
import {ImportConfigurationButton} from 'packages/smol/app/(apps)/disperse/components/ImportConfigurationButton';
import {DisperseWizard} from 'packages/smol/app/(apps)/disperse/components/Wizard';
import {useDisperse} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse';
import {newDisperseVoidRow} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse.helpers';
import {SmolTokenSelector} from 'packages/smol/common/SmolTokenSelector';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {TDisperseInput} from 'packages/smol/app/(apps)/disperse/types';
import type {ReactElement} from 'react';

const Disperse = memo(function Disperse(): ReactElement {
	const chainID = useChainId();
	const config = useConfig();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const {configuration, dispatchConfiguration} = useDisperse();
	const {getPrice, pricingHash} = usePrices();
	const {getCachedEntry} = useAddressBook();
	const [price, setPrice] = useState<TNormalizedBN | undefined>(undefined);
	const {validate: validateAmount} = useValidateAmountInput();
	const {validate: validateAddress} = useValidateAddressInput();
	const plausible = usePlausible();
	const [isLoadingReceivers, setIsLoadingReceivers] = useState(false);

	const createQueryString = useCallback(
		(name: string, value: string | undefined) => {
			const params = new URLSearchParams(searchParams?.toString());
			if (value === undefined) {
				params.delete(name);
			} else {
				params.set(name, value);
			}

			return params.toString();
		},
		[searchParams]
	);

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
	 ** This effect hook will be triggered when the property token, chainID or the
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!configuration.tokenToSend) {
			return;
		}
		setPrice(getPrice(configuration.tokenToSend));
	}, [configuration.tokenToSend, chainID, pricingHash, getPrice]);

	/**********************************************************************************************
	 ** This useCallback is used to set the token to send in the configuration. It will dispatch
	 ** the SET_TOKEN_TO_SEND action with the new value.
	 *********************************************************************************************/
	const onSelectToken = useCallback(
		(token: TERC20TokensWithBalance | undefined): void => {
			dispatchConfiguration({type: 'SET_TOKEN_TO_SEND', payload: token});
			if (token?.address) {
				router.push(pathname + '?' + createQueryString('token', token.address));
			} else {
				router.push(pathname + '?' + createQueryString('token', undefined));
			}
		},
		[dispatchConfiguration, createQueryString, router, pathname]
	);

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
				/^((?:0x[a-fA-F0-9]{40}|[a-zA-Z0-9-]+\.eth))[\s,;]+((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\d+e[+-]?\d+)(?:\r?\n|$)/gm;

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
			setIsLoadingReceivers(true);
			for (const line of lines) {
				/**********************************************************************************
				 ** Trim the line but preserve internal whitespace
				 *********************************************************************************/
				const trimmedLine = line.trim();
				if (trimmedLine === '') {
					continue;
				}

				/**********************************************************************************
				 ** Extract the address (first 42 characters starting with 0x) or the ens name.
				 *********************************************************************************/
				const addressOrEnsMatch =
					trimmedLine.match(/^(0x[a-fA-F0-9]{40})/) || trimmedLine.match(/^[a-zA-Z0-9-]+\.eth/);
				if (!addressOrEnsMatch) {
					continue;
				}
				const [theAddressOrEns] = addressOrEnsMatch;

				/**********************************************************************************
				 ** Validate the address
				 *********************************************************************************/
				if (!isAddress(theAddressOrEns) && !theAddressOrEns.endsWith('.eth')) {
					continue;
				}

				const addressOrEns = await getAddressAndEns(theAddressOrEns, chainID, config);

				/**********************************************************************************
				 ** Extract the amount (everything after the address and any separators)
				 *********************************************************************************/
				const amountPart = trimmedLine.slice(theAddressOrEns.length).trim();

				/**********************************************************************************
				 ** Find the first valid number in the remaining part
				 *********************************************************************************/
				const theAmountMatch = amountPart.match(/((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\d+e[+-]?\d+)/i);
				const theAmount = theAmountMatch ? theAmountMatch[0] : '0';
				const parsedAmount = parseFloat(theAmount).toString();

				/**********************************************************************************
				 ** Create the receiver object
				 *********************************************************************************/
				const receiver = toAddress(theAddressOrEns);
				const ensName = await getEnsName(config, {address: receiver, chainId: mainnet.id});
				const addressBookEntry = await getCachedEntry({address: receiver});
				let label = toAddress(receiver) as string;
				if (addressBookEntry) {
					label = addressBookEntry.label;
				} else if (ensName) {
					label = ensName;
				}
				const value = {
					receiver: {
						address: addressOrEns?.address ?? toAddress(receiver),
						label,
						error: '',
						isValid: 'undetermined',
						source: 'typed'
					} as TInputAddressLike,
					value: {...newDisperseVoidRow().value, ...validateAmount(parsedAmount, configuration.tokenToSend)},
					UUID: crypto.randomUUID()
				};

				inputs.push(value);
			}
			setIsLoadingReceivers(false);
			dispatchConfiguration({type: 'PASTE_RECEIVERS', payload: inputs});
		};

		document.addEventListener('paste', handlePaste);
		return () => {
			document.removeEventListener('paste', handlePaste);
		};
	}, [
		chainID,
		configuration.inputs,
		configuration.tokenToSend,
		dispatchConfiguration,
		validateAddress,
		validateAmount,
		config,
		getCachedEntry
	]);

	return (
		<div className={'w-full'}>
			<div className={'mb-4 flex flex-wrap gap-2 text-xs'}>
				<ImportConfigurationButton setIsLoadingReceivers={setIsLoadingReceivers} />
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

			<div className={'flex items-center gap-4'}>
				<div className={'md:max-w-108 mb-6 w-full max-w-full'}>
					<p className={'mb-2 font-medium'}>{'Token'}</p>
					<SmolTokenSelector
						token={configuration.tokenToSend}
						onSelectToken={onSelectToken}
					/>
				</div>
				<div>{isLoadingReceivers && <IconLoader className={'animate-spin'} />}</div>
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
