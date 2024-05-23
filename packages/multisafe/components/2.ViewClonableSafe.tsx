import React, {useCallback, useMemo, useState} from 'react';
import {fromHex, type Hex} from 'viem';
import axios from 'axios';
import {cl, isZeroAddress, toAddress} from '@builtbymom/web3/utils';
import {getClient, retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import ChainStatus from '@multisafe/components/ChainStatus';
import AddressInput, {defaultInputAddressLike} from '@multisafeCommons/AddressInput';
import {PopoverSettings} from '@multisafeCommons/PopoverSettings';
import {PopoverSettingsItemTestnets} from '@multisafeCommons/PopoverSettings.item.testnets';
import {Renderable} from '@multisafeCommons/Renderable';
import ViewSectionHeading from '@multisafeCommons/ViewSectionHeading';
import IconWarning from '@multisafeIcons/IconWarning';
import {
	CALL_INIT_SIGNATURE,
	SAFE_CREATION_SIGNATURE,
	SAFE_CREATION_TOPIC,
	SINGLETON_L1,
	SINGLETON_L2,
	SINGLETON_L2_DDP
} from '@multisafeUtils/constants';
import {getTransaction} from '@wagmi/core';
import {Button} from '@lib/primitives/Button';
import {CHAINS} from '@lib/utils/tools.chains';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TInputAddressLike} from '@multisafeCommons/AddressInput';
import type {GetTransactionReturnType} from '@wagmi/core';

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
function ViewClonableSafe(): ReactElement {
	const [inputedValue, set_inputedValue] = useState<TInputAddressLike>(defaultInputAddressLike);
	const [shouldUseTestnets, set_shouldUseTestnets] = useState(false);
	const [existingSafeArgs, set_existingSafeArgs] = useState<
		TExistingSafeArgs | {error: string; isLoading: boolean} | undefined
	>(undefined);
	const supportedNetworks = useMemo(() => {
		return Object.values(CHAINS).filter(e => e.isMultisafeSupported);
	}, []);

	const retrieveSafeTxHash = useCallback(
		async (address: TAddress): Promise<{hash: Hex; chainID: number} | undefined> => {
			for (const chain of supportedNetworks) {
				try {
					const publicClient = getClient(chain.id);
					const byteCode = await publicClient.getBytecode({address});
					if (byteCode) {
						let txHash: Hex | null = '0x0';

						const safeAPI = CHAINS[chain.id]?.safeAPIURI || '';
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
		[supportedNetworks]
	);

	const decodeArgInitializers = useCallback(
		(
			argsHex: Hex
		): {
			owners: TAddress[];
			threshold: number;
			salt: bigint;
			singleton: TAddress;
		} => {
			const allParts = argsHex.substring(10).match(/.{1,64}/g);
			if (!allParts) {
				throw new Error('Invalid args');
			}
			const salt = `0x${allParts[2]}` as Hex;
			const args = argsHex.substring(argsHex.indexOf(SAFE_CREATION_SIGNATURE) + SAFE_CREATION_SIGNATURE.length);
			const parts = args.match(/.{1,64}/g);
			if (!parts) {
				throw new Error('Invalid args');
			}
			const threshold = Number(parts[1]);
			const ownersLength = Number(parts[8]);
			const owners = parts
				.slice(9, 9 + ownersLength)
				.map((owner): TAddress => toAddress(`0x${owner.substring(24)}`));

			let singleton = SINGLETON_L2;
			if (argsHex.toLowerCase().includes('3e5c63644e683549055b9be8653de26e0b4cd36e')) {
				singleton = SINGLETON_L2_DDP;
			} else if (argsHex.toLowerCase().includes('d9db270c1b5e3bd161e8c8503c55ceabee709552')) {
				singleton = SINGLETON_L1;
			}
			return {owners, threshold, salt: fromHex(salt, 'bigint'), singleton};
		},
		[]
	);

	const retrieveSafe = useCallback(
		async (address: TAddress): Promise<void> => {
			set_existingSafeArgs({isLoading: true, owners: [], threshold: 0, address, salt: 0n});
			const result = await retrieveSafeTxHash(address);
			if (result) {
				const {hash, chainID} = result;
				if (!hash) {
					console.warn(hash);
					return set_existingSafeArgs({error: 'No safe found at this address', isLoading: false});
				}
				const tx = await getTransaction(retrieveConfig(), {hash, chainId: chainID});
				const input = `0x${tx.input.substring(tx.input.indexOf(CALL_INIT_SIGNATURE))}`;
				const {owners, threshold, salt, singleton} = decodeArgInitializers(input as Hex);

				set_existingSafeArgs({owners, threshold, isLoading: false, address, salt, singleton, tx: tx});
			} else {
				set_existingSafeArgs({error: 'No safe found at this address', isLoading: false});
			}
		},
		[decodeArgInitializers, retrieveSafeTxHash]
	);

	function renderDeploymentData(): ReactElement {
		const safeArgs = existingSafeArgs as TExistingSafeArgs | undefined;
		return (
			<div className={'box-100 relative p-4 md:px-6'}>
				<div className={'grid grid-cols-1 gap-20 transition-colors'}>
					<div className={'flex flex-col gap-4'}>
						<div className={'flex flex-col'}>
							<small>{'Safe Address '}</small>
							<b className={'font-number addr break-all text-sm'}>
								<Renderable
									shouldRender={!!safeArgs?.address}
									fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
									{safeArgs?.address}
								</Renderable>
							</b>
						</div>
						<div className={'flex flex-col'}>
							<small>{'Owners '}</small>
							<Renderable
								shouldRender={!!safeArgs?.owners && safeArgs?.owners.length > 0}
								fallback={
									<div>
										<b className={'font-number block text-neutral-600'}>{'-'}</b>
										<b className={'font-number block text-neutral-600'}>{'-'}</b>
									</div>
								}>
								<div>
									{(safeArgs?.owners || []).map(
										(owner): ReactElement => (
											<b
												key={owner}
												className={'font-number addr block break-all text-sm md:text-base'}>
												{owner}
											</b>
										)
									)}
								</div>
							</Renderable>
						</div>
						<div className={'flex flex-col'}>
							<small>{'Threshold '}</small>
							<b className={'font-number block'}>
								<Renderable
									shouldRender={!!safeArgs?.threshold}
									fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
									{`${safeArgs?.threshold || 0} of ${(safeArgs?.owners || []).length}`}
								</Renderable>
							</b>
						</div>

						<div className={'flex flex-col'}>
							<small>{'Deployment status '}</small>
							<Renderable
								shouldRender={!!safeArgs?.address}
								fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
								<div className={'mt-1 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4'}>
									{supportedNetworks
										.filter((chain): boolean => ![5, 324, 1337, 84531].includes(chain.id))
										.map(
											(chain): ReactElement => (
												<ChainStatus
													key={chain.id}
													chain={chain}
													safeAddress={toAddress(safeArgs?.address)}
													owners={safeArgs?.owners || []}
													threshold={safeArgs?.threshold || 0}
													singleton={safeArgs?.singleton}
													salt={safeArgs?.salt || 0n}
												/>
											)
										)}
								</div>
								{shouldUseTestnets && (
									<div
										className={
											'mt-6 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-6 md:grid-cols-3 md:gap-4'
										}>
										{supportedNetworks
											.filter((chain): boolean => ![324].includes(chain.id))
											.filter((chain): boolean => [5, 1337, 84531].includes(chain.id))
											.map(
												(chain): ReactElement => (
													<ChainStatus
														key={chain.id}
														chain={chain}
														safeAddress={toAddress(safeArgs?.address)}
														owners={safeArgs?.owners || []}
														threshold={safeArgs?.threshold || 0}
														singleton={safeArgs?.singleton}
														salt={safeArgs?.salt || 0n}
													/>
												)
											)}
									</div>
								)}
							</Renderable>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<section>
			<div className={'box-0 grid w-full grid-cols-12'}>
				<ViewSectionHeading
					title={'One new safe, coming right up.'}
					content={
						'WARNING: your cloned safe will have the OG signers. If they are not frens anymore, create a new safe.'
					}
					configSection={
						<PopoverSettings>
							<PopoverSettingsItemTestnets
								isSelected={shouldUseTestnets}
								set_isSelected={set_shouldUseTestnets}
							/>
						</PopoverSettings>
					}
				/>
				<div className={'col-span-12 p-4 pt-0 md:p-6 md:pt-0'}>
					<form
						onSubmit={async (e): Promise<void> => e.preventDefault()}
						className={
							'grid w-full grid-cols-12 flex-row items-center justify-between gap-4 md:w-3/4 md:gap-6'
						}>
						<div className={'col-span-12 md:col-span-9'}>
							<AddressInput
								value={inputedValue}
								onChangeValue={(e): void => set_inputedValue(e)}
							/>
						</div>

						<div className={'col-span-12 md:col-span-3'}>
							<Button
								className={'!w-[160px] rounded-md !text-sm'}
								isBusy={existingSafeArgs?.isLoading}
								onClick={async (): Promise<void> => retrieveSafe(toAddress(inputedValue.address))}
								isDisabled={isZeroAddress(toAddress(inputedValue.address)) || !inputedValue.isValid}>
								{'Next'}
							</Button>
						</div>
					</form>
				</div>

				<div
					className={cl(
						!existingSafeArgs?.error && !existingSafeArgs?.isLoading && existingSafeArgs !== undefined
							? 'col-span-12 flex flex-col p-4 pt-0 text-neutral-900 md:p-6 md:pt-0 opacity-100'
							: 'pointer-events-none h-0 overflow-hidden opacity-0'
					)}>
					{renderDeploymentData()}
				</div>

				<div
					className={cl(
						existingSafeArgs?.error && !existingSafeArgs?.isLoading
							? 'col-span-12 flex flex-col p-4 pt-0 text-neutral-900 md:p-6 md:pt-0 opacity-100'
							: 'pointer-events-none h-0 overflow-hidden opacity-0'
					)}>
					<div
						className={
							'flex flex-row whitespace-pre rounded-md border border-red-200 !bg-red-200/60 p-2 text-xs font-bold text-red-600'
						}>
						<IconWarning className={'mr-2 size-4 text-red-600'} />
						{
							'Uh oh, this doesn’t appear to be a Safe address.\nPlease check you typed the correct address as we couldn’t find a Safe for this address.'
						}
					</div>
				</div>
			</div>
		</section>
	);
}

export default ViewClonableSafe;
