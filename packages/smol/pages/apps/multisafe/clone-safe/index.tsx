import React, {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {SafeDetailsCurtain} from 'lib/common/Curtains/SafeDetailsCurtain';
import {MultisafeAppInfo} from 'packages/smol/components/Multisafe/AppInfo';
import {CALL_INIT_SIGNATURE, SAFE_CREATION_TOPIC} from 'packages/smol/components/Multisafe/constants';
import {MultisafeContextApp, useMultisafe} from 'packages/smol/components/Multisafe/useMultisafe';
import {createUniqueID, decodeArgInitializers} from 'packages/smol/components/Multisafe/utils';
import axios from 'axios';
import {cl, isZeroAddress, toAddress, truncateHex, ZERO_ADDRESS} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {getTransaction, serialize} from '@wagmi/core';
import {SmolAddressInput} from '@lib/common/SmolAddressInput';
import {Warning} from '@lib/common/Warning';
import {IconDoc} from '@lib/icons/IconDoc';
import {IconInfoLight} from '@lib/icons/IconInfo';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {defaultInputAddressLike} from '@lib/utils/tools.address';
import {CHAINS} from '@lib/utils/tools.chains';

import type {ReactElement} from 'react';
import type {GetTransactionReturnType, Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TInputAddressLike} from '@lib/utils/tools.address';

type TExistingSafeArgs = {
	address: TAddress;
	owners: TAddress[];
	salt: bigint;
	threshold: number;
	singleton?: TAddress;
	paymentReceiver?: TAddress;
	tx?: GetTransactionReturnType;
	error?: string;
	isLoading: boolean;
};

const defaultExistingSafeArgs: TExistingSafeArgs = {
	isLoading: false,
	owners: [],
	threshold: 0,
	address: ZERO_ADDRESS,
	salt: 0n
};

function Safe(): ReactElement {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const plausible = usePlausible();
	const [isInfoOpen, set_isInfoOpen] = useState<boolean>(false);
	const {onClickFAQ} = useMultisafe();
	const [safe, set_safe] = useState<TInputAddressLike>(defaultInputAddressLike);
	const [existingSafeArgs, set_existingSafeArgs] = useState<TExistingSafeArgs | undefined>(undefined);
	const uniqueIdentifier = useRef<string | undefined>(undefined);
	const supportedChains = useMemo(() => Object.values(CHAINS).filter(e => e.isMultisafeSupported), []);

	/**********************************************************************************************
	 ** RetrieveSafeTxHash is a function that will try to find the transaction hash that created
	 ** the Safe at the given address. As we are dealing with multiple chains and we don't know on
	 ** which chain the Safe was deployed, we will try to find the transaction hash on each chain,
	 ** until we find it.
	 ** The process is as follows:
	 ** - Try to get the byteCode of the address.
	 ** - Try to call the safe API (if enabled) to get the transaction hash.
	 ** - Otherwise, try to get the transaction hash from the logs.
	 ** And there, we either have the transaction hash or we don't (no Safe found at this address).
	 *********************************************************************************************/
	const retrieveSafeTxHash = useCallback(
		async (address: TAddress): Promise<{hash: Hex; chainID: number} | undefined> => {
			for (const chain of supportedChains) {
				try {
					const publicClient = getClient(chain.id);
					const byteCode = await publicClient.getBytecode({address});
					if (byteCode) {
						let txHash: Hex | null = '0x0';

						const safeAPI = CHAINS[chain.id].safeAPIURI;
						if (safeAPI) {
							try {
								const {data: creationData} = await axios.get(
									`${safeAPI}/api/v1/safes/${toAddress(address)}/creation/`
								);
								if (creationData?.transactionHash) {
									txHash = creationData.transactionHash;
								}
								if (txHash) {
									return {hash: txHash, chainID: chain.id};
								}
							} catch (error) {
								// nothing
							}
						}
						if (!safeAPI) {
							const rangeLimit = 10_000_000n;
							const currentBlockNumber = await publicClient.getBlockNumber();
							const deploymentBlockNumber = 0n;
							for (let i = deploymentBlockNumber; i < currentBlockNumber; i += rangeLimit) {
								const logs = await publicClient.getLogs({
									address,
									fromBlock: i,
									toBlock: i + rangeLimit
								});
								if (logs.length > 0 && logs[0].topics?.[0] === SAFE_CREATION_TOPIC) {
									txHash = logs[0].transactionHash;
								}
							}
						}
						if (txHash) {
							return {hash: txHash, chainID: chain.id};
						}
					}
				} catch (error) {
					// nothing
				}
			}
			return undefined;
		},
		[supportedChains]
	);

	/**********************************************************************************************
	 ** RetrieveSafe is a function that will try to retrieve the Safe details from the given
	 ** address. If the address is not valid, the function will return immediately. If no Safe is
	 ** found at the address, the function will set an error in the existingSafeArgs state.
	 *********************************************************************************************/
	const retrieveSafe = useCallback(
		async (address: TAddress): Promise<void> => {
			if (!address || isZeroAddress(address)) {
				return;
			}
			set_existingSafeArgs({...defaultExistingSafeArgs, isLoading: true, address});
			const result = await retrieveSafeTxHash(address);
			if (result) {
				const {hash, chainID} = result;
				if (!hash) {
					console.warn(hash);
					set_existingSafeArgs({
						...defaultExistingSafeArgs,
						error: 'No safe found at this address',
						isLoading: false
					});
					return;
				}
				const tx = await getTransaction(retrieveConfig(), {hash, chainId: chainID});
				const input = `0x${tx.input.substring(tx.input.indexOf(CALL_INIT_SIGNATURE))}`;
				const {owners, threshold, salt, singleton, paymentReceiver} = decodeArgInitializers(input as Hex);

				set_existingSafeArgs({
					owners,
					threshold,
					isLoading: false,
					address,
					salt,
					singleton,
					tx: tx,
					paymentReceiver
				});
			} else {
				set_existingSafeArgs({
					...defaultExistingSafeArgs,
					error: 'No safe found at this address',
					isLoading: false
				});
			}
		},
		[retrieveSafeTxHash]
	);

	/**********************************************************************************************
	 ** The user can come to this page with a bunch of query arguments. If this is the case, we
	 ** should populate the form with the values from the query arguments.
	 ** The valid query arguments are:
	 ** - address: The address of the Safe to be deployed.
	 ** - owners: A list of addresses separated by underscores.
	 ** - threshold: The number of owners required to confirm a transaction.
	 ** - singleton: The type of Safe to be deployed.
	 ** - salt: The seed to be used for the CREATE2 address computation.
	 ** Any "valid" value can be passed, but if we cannot regenerate the safe address from the
	 ** other values, an error will be displayed.
	 **
	 ** The uniqueIdentifier is used to prevent the useEffect from overwriting the form values
	 ** once we have set them from the query arguments.
	 *********************************************************************************************/
	useEffect(() => {
		if (uniqueIdentifier.current) {
			return;
		}
		const {address} = router.query;
		if (address && !isZeroAddress(address as string)) {
			set_safe({
				address: toAddress(address as string),
				label: truncateHex(toAddress(address as string), 5),
				source: 'autoPopulate',
				isValid: true
			});
		}
		uniqueIdentifier.current = createUniqueID(serialize(router.query));
	}, [router.query]);

	/**********************************************************************************************
	 ** The navigateToDeploy function is used to navigate to the /deploy route with the query
	 ** arguments generated from the linkToDeploy URLSearchParams object.
	 ** One little trick here is that we are first replacing the current URL with the new query
	 ** arguments in order to update the browser history. Thanks to this, the user can navigate
	 ** back to this page and the form will be populated with the same values.
	 *********************************************************************************************/
	const navigateToDeploy = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.PREPARE_CLONE_SAFE, {
			props: {
				ownersCount: existingSafeArgs?.owners.length,
				threshold: existingSafeArgs?.threshold,
				singleton: existingSafeArgs?.singleton
			}
		});

		const URLQueryParam = new URLSearchParams();
		URLQueryParam.set('address', toAddress(safe.address));
		router.replace(`/apps/multisafe/clone-safe?${URLQueryParam.toString()}`);
		router.push(`/apps/multisafe/clone-safe/${toAddress(safe.address)}`);
	}, [
		existingSafeArgs?.owners.length,
		existingSafeArgs?.singleton,
		existingSafeArgs?.threshold,
		plausible,
		router,
		safe.address
	]);

	return (
		<div className={'md:max-w-108 grid w-full max-w-full gap-4'}>
			<div className={'-mt-2 flex flex-wrap gap-2 text-xs'}>
				<Button
					className={'!h-8 !text-xs'}
					variant={'light'}
					onClick={() => {
						plausible(PLAUSIBLE_EVENTS.OPEN_MULTISAFE_FAQ_CURTAIN);
						onClickFAQ();
					}}>
					<IconDoc className={'mr-2 size-3'} />
					{'View FAQ'}
				</Button>
			</div>
			<div>
				<div className={'mb-2'}>
					<p className={'text-sm font-medium md:text-base'}>{'Safe Address'}</p>
				</div>
				<div className={'relative flex w-full items-center'}>
					<SmolAddressInput
						inputRef={inputRef}
						value={safe}
						onSetValue={newValue => {
							set_safe(newValue as TInputAddressLike);
							retrieveSafe(toAddress(newValue.address));
						}}
					/>
					<button
						className={cl(
							'absolute -right-6 inset-y-0',
							'hidden md:block text-neutral-600 transition-colors hover:text-neutral-700',
							!existingSafeArgs || Boolean(existingSafeArgs.error) || existingSafeArgs.isLoading
								? 'pointer-events-none invisible'
								: 'visible'
						)}
						onClick={() => set_isInfoOpen(true)}>
						<IconInfoLight className={'size-4 text-neutral-600 transition-colors hover:text-neutral-700'} />
					</button>
				</div>
			</div>
			<div className={'flex gap-2'}>
				<Button
					onClick={navigateToDeploy}
					isBusy={existingSafeArgs?.isLoading}
					isDisabled={!existingSafeArgs || Boolean(existingSafeArgs.error)}
					className={'group !h-8 w-auto md:min-w-[160px]'}>
					<p className={'text-sm'}>{'Choose network & deploy'}</p>
				</Button>
				<button
					className={cl(
						'block md:hidden text-neutral-600 transition-colors hover:text-neutral-700',
						!existingSafeArgs || Boolean(existingSafeArgs.error) || existingSafeArgs.isLoading
							? 'pointer-events-none invisible'
							: 'visible'
					)}
					onClick={() => set_isInfoOpen(true)}>
					<IconInfoLight className={'size-4 text-neutral-600 transition-colors hover:text-neutral-700'} />
				</button>
			</div>

			{existingSafeArgs && !existingSafeArgs.error && !existingSafeArgs.isLoading && (
				<SafeDetailsCurtain
					isOpen={isInfoOpen}
					onOpenChange={set_isInfoOpen}
					address={existingSafeArgs?.address}
					owners={existingSafeArgs?.owners}
					threshold={existingSafeArgs?.threshold}
					seed={existingSafeArgs?.salt}
				/>
			)}

			{existingSafeArgs?.error && (
				<div className={'mb-4 grid gap-2'}>
					<Warning
						message={existingSafeArgs.error}
						type={'error'}
					/>
				</div>
			)}
		</div>
	);
}

export default function MultisafeCloneWrapper(): ReactElement {
	const router = useRouter();
	if (!router.isReady) {
		return <Fragment />;
	}

	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}

MultisafeCloneWrapper.AppName = 'Make your Safe a Multisafe';
MultisafeCloneWrapper.AppDescription = 'Clone your existing Safe and give it the same address on every chain.';
MultisafeCloneWrapper.AppInfo = <MultisafeAppInfo />;

/**************************************************************************************************
 ** Metadata for the page: /apps/multisafe/clone-safe
 *************************************************************************************************/
MultisafeCloneWrapper.MetadataTitle = 'Multisafe - Built by MOM';
MultisafeCloneWrapper.MetadataDescription =
	'Get the same Safe address on every chain. Either create a new safe, or clone an existing one to start.';
MultisafeCloneWrapper.MetadataURI = 'https://smold.app/apps/multisafe/clone-safe';
MultisafeCloneWrapper.MetadataOG = 'https://smold.app/og.png';
MultisafeCloneWrapper.MetadataTitleColor = '#000000';
MultisafeCloneWrapper.MetadataThemeColor = '#FFD915';
