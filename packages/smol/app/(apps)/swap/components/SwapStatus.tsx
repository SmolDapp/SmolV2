import {supportedNetworks} from '@lib/utils/tools.chains';
import {isEthAddress, isZeroAddress, toAddress} from 'lib/utils/tools.addresses';
import Link from 'next/link';
import {useState} from 'react';
import {useAccount, useConfig} from 'wagmi';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';
import {Warning} from 'packages/smol/common/Warning';

import {useSwapFlow} from '../contexts/useSwapFlow.lifi';

import type {TWarningType} from 'packages/smol/common/Warning';
import type {ReactElement, ReactNode} from 'react';

function TriggerAddressBookButton({children}: {children: ReactNode}): ReactElement {
	const {setCurtainStatus, dispatchConfiguration} = useAddressBook();
	const {receiver} = useSwapFlow();

	return (
		<button
			className={'font-bold transition-all'}
			onClick={() => {
				const hasALabel = isZeroAddress(receiver.label);
				dispatchConfiguration({
					type: 'SET_SELECTED_ENTRY',
					payload: {
						address: receiver.address,
						label: hasALabel ? receiver.label : '',
						slugifiedLabel: '',
						chains: [],
						isFavorite: false
					}
				});
				setCurtainStatus({isOpen: true, isEditing: true});
			}}>
			{children}
		</button>
	);
}

export function SwapStatus(props: {destinationChainID: number}): ReactElement | null {
	const {address} = useAccount();
	const config = useConfig();
	const {receiver, currentError} = useSwapFlow();
	const {getEntry} = useAddressBook();
	const [status, setStatus] = useState<{type: TWarningType; message: string | ReactElement}[]>([]);

	useAsyncTrigger(async (): Promise<void> => {
		const allStatus: {type: TWarningType; message: string | ReactElement}[] = [];

		if (currentError) {
			allStatus.push({message: currentError, type: 'error'});
		}

		const fromAddressBook = await getEntry({address: receiver.address});
		if (!receiver.address) {
			return setStatus(allStatus);
		}

		if (isEthAddress(receiver.address)) {
			allStatus.push({
				message: 'Yo… uh… hmm… this is an invalid address. Tokens sent here may be lost forever. Oh no!',
				type: 'error'
			});
		}

		if (
			receiver.address &&
			(!fromAddressBook || (fromAddressBook?.numberOfInteractions === 0 && fromAddressBook.isHidden))
		) {
			allStatus.push({
				message: (
					<>
						{'This is the first time you interact with this address, please be careful.'}&nbsp;
						<TriggerAddressBookButton>{'Wanna add it to Address Book?'}</TriggerAddressBookButton>
					</>
				),
				type: 'warning'
			});
		}

		if (receiver.address && fromAddressBook?.isHidden) {
			allStatus.push({
				message: (
					<>
						{'This address isn’t in your address book.'}&nbsp;
						<TriggerAddressBookButton>{'Wanna add it?'}</TriggerAddressBookButton>
					</>
				),
				type: 'warning'
			});
		}

		if (receiver.address && !fromAddressBook?.chains.includes(props.destinationChainID)) {
			const currentNetworkName = supportedNetworks.find(network => network.id === props.destinationChainID)?.name;
			const fromAddressBookNetworkNames = fromAddressBook?.chains
				.map(chain => supportedNetworks.find(network => network.id === chain)?.name)
				.join(', ');
			if (fromAddressBookNetworkNames) {
				allStatus.push({
					message: `You added this address on ${fromAddressBookNetworkNames}, please check it can receive funds on ${currentNetworkName}.`,
					type: 'warning'
				});
			}
		}

		if (toAddress(receiver.address) !== toAddress(address)) {
			const network = config.chains.find(chain => chain.id === props.destinationChainID);
			allStatus.push({
				message: (
					<>
						{
							'You are about to swap and send your tokens to another address.\nPlease double-check the receiver: '
						}
						<Link
							target={'_blank'}
							href={`${network?.blockExplorers?.default?.url || 'https://etherscan.io'}/address/${receiver.address}`}
							className={'cursor-alias font-bold underline transition-all'}>
							{receiver.address}
						</Link>
						{'.'}
					</>
				),
				type: 'warning'
			});
		}

		setStatus(allStatus);
	}, [currentError, getEntry, receiver.address, props.destinationChainID, address, config.chains]);

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
