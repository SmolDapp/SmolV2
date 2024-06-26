import {useState} from 'react';
import Link from 'next/link';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {isEthAddress, isZeroAddress, toAddress} from '@builtbymom/web3/utils';
import {getNetwork} from '@builtbymom/web3/utils/wagmi';
import {Warning} from '@lib/common/Warning';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {supportedNetworks} from '@lib/utils/tools.chains';

import {useSwapFlow} from './useSwapFlow.lifi';

import type {ReactElement, ReactNode} from 'react';
import type {TWarningType} from '@lib/common/Warning';

function TriggerAddressBookButton({children}: {children: ReactNode}): ReactElement {
	const {set_curtainStatus, dispatchConfiguration} = useAddressBook();
	const {configuration} = useSwapFlow();

	return (
		<button
			className={'font-bold transition-all'}
			onClick={() => {
				const hasALabel = isZeroAddress(configuration.receiver.label);
				dispatchConfiguration({
					type: 'SET_SELECTED_ENTRY',
					payload: {
						address: configuration.receiver.address,
						label: hasALabel ? configuration.receiver.label : '',
						slugifiedLabel: '',
						chains: [],
						isFavorite: false
					}
				});
				set_curtainStatus({isOpen: true, isEditing: true});
			}}>
			{children}
		</button>
	);
}

export function SwapStatus(props: {destinationChainID: number}): ReactElement | null {
	const {address} = useWeb3();
	const {configuration, currentError} = useSwapFlow();
	const {getEntry} = useAddressBook();
	const [status, set_status] = useState<{type: TWarningType; message: string | ReactElement}[]>([]);

	useAsyncTrigger(async (): Promise<void> => {
		const allStatus: {type: TWarningType; message: string | ReactElement}[] = [];

		if (currentError) {
			allStatus.push({message: currentError, type: 'error'});
		}

		const fromAddressBook = await getEntry({address: configuration.receiver.address});
		if (!configuration.receiver.address) {
			return set_status(allStatus);
		}

		if (isEthAddress(configuration.receiver.address)) {
			allStatus.push({
				message: 'Yo… uh… hmm… this is an invalid address. Tokens sent here may be lost forever. Oh no!',
				type: 'error'
			});
		}

		if (
			configuration.receiver.address &&
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

		if (configuration.receiver.address && fromAddressBook?.isHidden) {
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

		if (configuration.receiver.address && !fromAddressBook?.chains.includes(props.destinationChainID)) {
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

		if (toAddress(configuration.receiver.address) !== toAddress(address)) {
			const network = getNetwork(props.destinationChainID);
			allStatus.push({
				message: (
					<>
						{
							'You are about to swap and send your tokens to another address.\nPlease double-check the receiver: '
						}
						<Link
							target={'_blank'}
							href={`${network.blockExplorers?.default?.url || 'https://etherscan.io'}/address/${configuration.receiver.address}`}
							className={'cursor-alias font-bold underline transition-all'}>
							{configuration.receiver.address}
						</Link>
						{'.'}
					</>
				),
				type: 'warning'
			});
		}

		set_status(allStatus);
	}, [getEntry, configuration.receiver.address, currentError, props.destinationChainID, address]);

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
