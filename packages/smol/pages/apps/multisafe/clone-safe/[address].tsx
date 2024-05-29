import React, {Fragment, useCallback, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {SafeDetailsCurtain} from 'lib/common/Curtains/SafeDetailsCurtain';
import axios from 'axios';
import {cl, isZeroAddress, toAddress, ZERO_ADDRESS} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {MultisafeAppInfo} from '@smolSections/Multisafe/AppInfo';
import ChainStatus from '@smolSections/Multisafe/ChainStatus';
import {CALL_INIT_SIGNATURE, SAFE_CREATION_TOPIC} from '@smolSections/Multisafe/constants';
import {MultisafeContextApp, useMultisafe} from '@smolSections/Multisafe/useMultisafe';
import {decodeArgInitializers} from '@smolSections/Multisafe/utils';
import {getTransaction, type GetTransactionReturnType} from '@wagmi/core';
import {ReadonlySmolAddressInput} from '@lib/common/SmolAddressInput.readonly';
import {IconBug} from '@lib/icons/IconBug';
import {IconDoc} from '@lib/icons/IconDoc';
import {IconInfoLight} from '@lib/icons/IconInfo';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {CHAINS} from '@lib/utils/tools.chains';

import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';

type TExistingSafeArgs = {
	address: TAddress;
	owners: TAddress[];
	salt: bigint;
	threshold: number;
	singleton?: TAddress;
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
	const plausible = usePlausible();
	const {onClickFAQ} = useMultisafe();
	const [shouldUseTestnets, set_shouldUseTestnets] = useState<boolean>(false);
	const address = toAddress((router.query.address || '') as string);
	const [existingSafeArgs, set_existingSafeArgs] = useState<TExistingSafeArgs | undefined>(undefined);
	const [isInfoOpen, set_isInfoOpen] = useState<boolean>(false);
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
				const {owners, threshold, salt, singleton} = decodeArgInitializers(input as Hex);

				set_existingSafeArgs({owners, threshold, isLoading: false, address, salt, singleton, tx: tx});
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
		retrieveSafe(address);
	}, [address, retrieveSafe, router.query]);

	return (
		<Fragment>
			<div className={'grid w-full max-w-[600px] gap-6'}>
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
					<Button
						className={'!h-8 !text-xs'}
						variant={shouldUseTestnets ? 'filled' : 'light'}
						onClick={() => set_shouldUseTestnets(!shouldUseTestnets)}>
						<IconBug className={'mr-2 size-3'} />
						{'Enable Testnets'}
					</Button>
				</div>

				<div>
					<div className={'mb-2'}>
						<p className={'text-sm font-medium md:text-base'}>{'Safe Address'}</p>
					</div>
					<div className={'relative flex items-center'}>
						<ReadonlySmolAddressInput value={address} />
						<button
							className={cl(
								'hidden md:block mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700',
								!existingSafeArgs || Boolean(existingSafeArgs.error) || existingSafeArgs.isLoading
									? 'pointer-events-none invisible'
									: 'visible'
							)}
							onClick={() => set_isInfoOpen(true)}>
							<IconInfoLight
								className={'size-4 text-neutral-600 transition-colors hover:text-neutral-700'}
							/>
						</button>
					</div>
					<div className={'block pl-1 md:hidden'}>
						<button onClick={() => set_isInfoOpen(true)}>
							<small>{'See Safe Info'}</small>
						</button>
					</div>
				</div>

				<div>
					<div className={'mb-2'}>
						<p className={'text-sm font-medium md:text-base'}>{'Deployments'}</p>
					</div>
					<div className={'flex flex-col overflow-hidden'}>
						<div className={'grid grid-cols-1 gap-2'}>
							{supportedChains
								.filter(chain => !chain.testnet)
								.map(
									(chain): ReactElement => (
										<ChainStatus
											key={chain.id}
											chain={chain}
											safeAddress={toAddress(address)}
											owners={existingSafeArgs?.owners || []}
											threshold={existingSafeArgs?.threshold || 0}
											singleton={existingSafeArgs?.singleton}
											salt={existingSafeArgs?.salt || 0n}
										/>
									)
								)}
						</div>
						{shouldUseTestnets && (
							<div className={'mt-6 grid gap-2 border-t border-neutral-100 pt-6'}>
								{supportedChains
									.filter(chain => chain.testnet)
									.map(
										(chain): ReactElement => (
											<ChainStatus
												key={chain.id}
												chain={chain}
												safeAddress={toAddress(address)}
												owners={existingSafeArgs?.owners || []}
												threshold={existingSafeArgs?.threshold || 0}
												singleton={existingSafeArgs?.singleton}
												salt={existingSafeArgs?.salt || 0n}
											/>
										)
									)}
							</div>
						)}
					</div>
				</div>
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
		</Fragment>
	);
}

export default function MultisafeClonableWrapper(): ReactElement {
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

MultisafeClonableWrapper.AppName = 'Clone Your Safe!';
MultisafeClonableWrapper.AppDescription =
	'Choose the networks for deploying your cloned Safe. Expand your secure asset management to new blockchains effortlessly.';
MultisafeClonableWrapper.AppInfo = <MultisafeAppInfo />;
