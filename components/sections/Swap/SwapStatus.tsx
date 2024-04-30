import {useState} from 'react';
import {useAddressBook} from 'contexts/useAddressBook';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {isEthAddress, isZeroAddress} from '@builtbymom/web3/utils';
import {supportedNetworks} from '@utils/tools.chains';
import {Warning} from '@common/Primitives/Warning';

import {useSwapFlow} from './useSwapFlow.lifi';

import type {ReactElement, ReactNode} from 'react';
import type {TWarningType} from '@common/Primitives/Warning';

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

export function SwapStatus(): ReactElement | null {
	const {configuration, currentError} = useSwapFlow();
	const {safeChainID} = useChainID();
	const {getEntry} = useAddressBook();
	const [status, set_status] = useState<{type: TWarningType; message: string | ReactElement} | null>(null);

	useAsyncTrigger(async (): Promise<void> => {
		const fromAddressBook = await getEntry({address: configuration.receiver.address});

		if (currentError) {
			return set_status({
				message: currentError,
				type: 'error'
			});
		}

		if (isEthAddress(configuration.receiver.address)) {
			return set_status({
				message: 'Yo… uh… hmm… this is an invalid address. Tokens sent here may be lost forever. Oh no!',
				type: 'error'
			});
		}

		if (
			configuration.receiver.address &&
			(!fromAddressBook || (fromAddressBook?.numberOfInteractions === 0 && fromAddressBook.isHidden))
		) {
			return set_status({
				message: (
					<>
						{'This is the first time you interact with this address, please be careful.'}
						<TriggerAddressBookButton>{'Wanna add it to Address Book?'}</TriggerAddressBookButton>
					</>
				),
				type: 'warning'
			});
		}

		if (configuration.receiver.address && fromAddressBook?.isHidden) {
			return set_status({
				message: (
					<>
						{'This address isn’t in your address book.'}{' '}
						<TriggerAddressBookButton>{'Wanna add it?'}</TriggerAddressBookButton>
					</>
				),
				type: 'warning'
			});
		}

		if (configuration.receiver.address && !fromAddressBook?.chains.includes(safeChainID)) {
			const currentNetworkName = supportedNetworks.find(network => network.id === safeChainID)?.name;
			const fromAddressBookNetworkNames = fromAddressBook?.chains
				.map(chain => supportedNetworks.find(network => network.id === chain)?.name)
				.join(', ');

			return set_status({
				message: `You added this address on ${fromAddressBookNetworkNames}, please check it can receive funds on ${currentNetworkName}.`,
				type: 'warning'
			});
		}

		return set_status(null);
	}, [configuration.receiver.address, getEntry, currentError, safeChainID]);

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
