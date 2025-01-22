import {getIsSmartContract, isEthAddress} from '@lib/utils/tools.addresses';
import {supportedNetworks} from '@lib/utils/tools.chains';
import {useState} from 'react';
import {useChainId, useConfig} from 'wagmi';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {useAsyncTrigger} from '@smolHooks/useAsyncTrigger';
import {TriggerAddressBookButton} from 'packages/smol/app/(apps)/send/components/TriggerAddressBookButton';
import {useSendContext} from 'packages/smol/app/(apps)/send/contexts/useSendContext';
import {Warning} from 'packages/smol/common/Warning';

import type {TWarningType} from 'packages/smol/common/Warning';
import type {ReactElement} from 'react';

export function SendStatus({isReceiverERC20}: {isReceiverERC20: boolean}): ReactElement | null {
	const {configuration} = useSendContext();
	const config = useConfig();
	const chainID = useChainId();
	const {getEntry} = useAddressBook();
	const [status, setStatus] = useState<{type: TWarningType; message: string | ReactElement} | null>(null);

	useAsyncTrigger(async (): Promise<void> => {
		const isSmartContract =
			!!configuration.receiver.address &&
			(await getIsSmartContract({
				address: configuration.receiver.address,
				chainId: chainID,
				config: config
			}));

		const fromAddressBook = await getEntry({address: configuration.receiver.address});

		if (isSmartContract && !fromAddressBook && !isReceiverERC20) {
			return setStatus({
				message: (
					<>
						{
							<>
								{
									"'Hello. Looks like you’re sending to a smart contract address. If it’s intentional, go right ahead, otherwise you might want to double check.'"
								}
								<TriggerAddressBookButton>
									{'By the way, this contact is not in your address book. Wanna add it?'}
								</TriggerAddressBookButton>
							</>
						}
					</>
				),
				type: 'warning'
			});
		}

		if (isEthAddress(configuration.receiver.address)) {
			return setStatus({
				message: 'Yo… uh… hmm… this is an invalid address. Tokens sent here may be lost forever. Oh no!',
				type: 'error'
			});
		}

		if (isReceiverERC20) {
			return setStatus({
				message: 'You’re sending to an ERC20 token address. Tokens sent here may be lost forever. Rip!',
				type: 'error'
			});
		}

		if (
			configuration.receiver.address &&
			(!fromAddressBook || (fromAddressBook?.numberOfInteractions === 0 && fromAddressBook.isHidden))
		) {
			return setStatus({
				message: (
					<>
						<p className={'whitespace-normal'}>
							{'This is the first time you interact with this address, please be careful. '}
							<TriggerAddressBookButton>{'Wanna add it to Address Book?'}</TriggerAddressBookButton>
						</p>
					</>
				),
				type: 'warning'
			});
		}

		if (configuration.receiver.address && fromAddressBook?.isHidden) {
			return setStatus({
				message: (
					<>
						{'This address isn’t in your address book.'}{' '}
						<TriggerAddressBookButton>{'Wanna add it?'}</TriggerAddressBookButton>
					</>
				),
				type: 'warning'
			});
		}

		if (configuration.receiver.address && !fromAddressBook?.chains.includes(chainID)) {
			const currentNetworkName = supportedNetworks.find(network => network.id === chainID)?.name;
			const fromAddressBookNetworkNames = fromAddressBook?.chains
				.map(chain => supportedNetworks.find(network => network.id === chain)?.name)
				.join(', ');

			return setStatus({
				message: `You added this address on ${fromAddressBookNetworkNames}, please check it can receive funds on ${currentNetworkName}.`,
				type: 'warning'
			});
		}

		return setStatus(null);
	}, [configuration.receiver.address, getEntry, isReceiverERC20, chainID, config]);

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
