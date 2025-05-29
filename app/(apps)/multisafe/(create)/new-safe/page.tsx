'use client';

import assert from 'assert';

import {useRouter, useSearchParams} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import React, {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {concat, encodePacked, getContractAddress, hexToBigInt, keccak256, toHex, zeroAddress} from 'viem';
import {serialize} from 'wagmi';

import {Button} from '@lib/components/Button';
import {IconCross} from '@lib/components/icons/IconCross';
import {IconDoc} from '@lib/components/icons/IconDoc';
import {IconFire} from '@lib/components/icons/IconFire';
import {SmolAddressInput} from '@lib/components/SmolAddressInput';
import {ReadonlySmolAddressInput} from '@lib/components/SmolAddressInput.readonly';
import {cl} from '@lib/utils/helpers';
import {toBigInt} from '@lib/utils/numbers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {isZeroAddress, toAddress} from '@lib/utils/tools.addresses';
import {ConfigurationStatus} from 'app/(apps)/multisafe/components/ConfigurationStatus';
import {
	GNOSIS_SAFE_PROXY_CREATION_CODE,
	PROXY_FACTORY_L2,
	PROXY_FACTORY_L2_DDP,
	SINGLETON_L2,
	SINGLETON_L2_DDP
} from 'app/(apps)/multisafe/constants';
import {MultisafeContextApp, useMultisafe} from 'app/(apps)/multisafe/contexts/useMultisafe';
import {createUniqueID, generateArgInitializers, getFallbackHandler} from 'app/(apps)/multisafe/utils';

import type {TAddress, TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TInputAddressLikeWithUUID} from 'app/(apps)/multisafe/contexts/useMultisafe';
import type {ReactElement, RefObject} from 'react';
import type {Hex} from 'viem';

function SafeOwner(props: {
	owner: TInputAddressLike;
	updateOwner: (value: Partial<TInputAddressLike>) => void;
	removeOwner: () => void;
}): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className={'flex w-full md:max-w-full'}>
			<div className={'w-full md:max-w-108'}>
				<SmolAddressInput
					inputRef={inputRef as RefObject<HTMLInputElement>}
					onSetValue={props.updateOwner}
					value={props.owner}
				/>
			</div>
			<button
				className={'pl-2 text-neutral-600 transition-colors hover:text-neutral-700 md:mx-2 md:p-2'}
				onClick={props.removeOwner}>
				<IconCross className={'size-4'} />
			</button>
		</div>
	);
}

function Safe(): ReactElement {
	const router = useRouter();
	const searchParams = useSearchParams();
	const plausible = usePlausible();
	const {threshold, onUpdateThreshold, owners, onAddOwner, onSetOwners, onUpdateOwner, onRemoveOwner, onClickFAQ} =
		useMultisafe();
	const uniqueIdentifier = useRef<string | undefined>(undefined);
	const shouldCancel = useRef(false);
	const [safeAddress, setSafeAddress] = useState<TAddress | undefined>(undefined);
	const [prefix, setPrefix] = useState<string | undefined>(undefined);
	const [suffix, setSuffix] = useState('');
	const [currentSeed, setCurrentSeed] = useState(
		hexToBigInt(keccak256(concat([toHex('smol'), toHex(Math.random().toString())])))
	);
	const [factory, setFactory] = useState<'ssf' | 'ddp'>('ssf');
	const [shouldUseExpertMode, setShouldUseExpertMode] = useState<boolean>(false);
	const [isLoadingSafes, setIsLoadingSafes] = useState(false);

	/**********************************************************************************************
	 ** The linkToDeploy is a memoized value that is used to generate the query arguments for the
	 ** deployment link. These arguments will be appended to the /deploy route to show the list
	 ** or networks on which the Safe can be deployed in the next page.
	 *********************************************************************************************/
	const linkToDeploy = useMemo(() => {
		const URLQueryParam = new URLSearchParams();

		URLQueryParam.set('owners', owners.map(owner => toAddress(owner.address)).join('_'));
		URLQueryParam.set('threshold', threshold.toString());
		URLQueryParam.set('singleton', factory);
		URLQueryParam.set('salt', currentSeed.toString());
		return URLQueryParam;
	}, [currentSeed, factory, owners, threshold]);

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
		const address = searchParams?.get('address');
		if (address && !isZeroAddress(address as string)) {
			setSafeAddress(toAddress(address as string));
		}
		const owners = searchParams?.get('owners');
		if (owners) {
			onSetOwners((owners as string).split('_').map(toAddress));
		}
		const threshold = searchParams?.get('threshold');
		if (threshold) {
			onUpdateThreshold(parseInt(threshold as string, 10));
		}
		const singleton = searchParams?.get('singleton');
		if (singleton) {
			assert(['ssf', 'ddp'].includes(singleton as string));
			setFactory(singleton as 'ssf' | 'ddp');
		}
		const salt = searchParams?.get('salt');
		if (salt) {
			setCurrentSeed(toBigInt(salt as string));
		}
		uniqueIdentifier.current = createUniqueID(serialize(searchParams));
	}, [onSetOwners, onUpdateThreshold, searchParams]);

	/**********************************************************************************************
	 ** The navigateToDeploy function is used to navigate to the /deploy route with the query
	 ** arguments generated from the linkToDeploy URLSearchParams object.
	 ** One little trick here is that we are first replacing the current URL with the new query
	 ** arguments in order to update the browser history. Thanks to this, the user can navigate
	 ** back to this page and the form will be populated with the same values.
	 *********************************************************************************************/
	const navigateToDeploy = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.PREPARE_NEW_SAFE, {
			props: {
				ownersCount: owners.length,
				threshold,
				singleton: factory,
				prefix,
				suffix
			}
		});

		const thisPageUpdatedQueryURL = linkToDeploy;
		thisPageUpdatedQueryURL.set('address', toAddress(safeAddress));
		router.replace(`/multisafe/new-safe?${thisPageUpdatedQueryURL.toString()}`);
		router.push(`/multisafe/new-safe/${safeAddress}?${linkToDeploy.toString()}`);
	}, [factory, linkToDeploy, owners.length, plausible, prefix, router, safeAddress, suffix, threshold]);

	/**********************************************************************************************
	 ** The onParamChange function is used to reset the safeAddress state when the parameters
	 ** of the form are changed. This is to ensure that the user is aware that the address
	 ** will be recomputed.
	 ** If this function is called when the user is generating a new address, the computation
	 ** will be cancelled.
	 *********************************************************************************************/
	const onParamChange = useCallback(() => {
		setSafeAddress(undefined);
		shouldCancel.current = true;
	}, []);

	const compute = useCallback(
		async ({
			argInitializers,
			bytecode,
			prefix,
			suffix,
			seed
		}: {
			argInitializers: string;
			bytecode: Hex;
			prefix?: string;
			suffix?: string;
			seed: bigint;
		}): Promise<{address: TAddress; salt: bigint}> => {
			if (shouldCancel.current) {
				return {address: '' as TAddress, salt: 0n};
			}
			const salt = keccak256(encodePacked(['bytes', 'uint256'], [keccak256(`0x${argInitializers}`), seed]));
			const addrCreate2 = getContractAddress({
				bytecode,
				from: factory == 'ssf' ? PROXY_FACTORY_L2 : PROXY_FACTORY_L2_DDP,
				opcode: 'CREATE2',
				salt
			});
			if (addrCreate2.startsWith(prefix ? `0x${prefix}` : prefix || '0x') && addrCreate2.endsWith(suffix || '')) {
				return {address: addrCreate2, salt: seed};
			}
			const newSalt = hexToBigInt(keccak256(concat([toHex('smol'), toHex(Math.random().toString())])));
			setCurrentSeed(newSalt);
			await new Promise(resolve => setTimeout(resolve, 0));
			return compute({argInitializers, bytecode, prefix, suffix, seed: newSalt});
		},
		[shouldCancel, factory]
	);

	const generateCreate2Addresses = useCallback(async (): Promise<void> => {
		setSafeAddress(undefined);
		setIsLoadingSafes(true);
		let seed = currentSeed;
		if (!shouldUseExpertMode || safeAddress) {
			seed = hexToBigInt(keccak256(concat([toHex('smol'), toHex(Math.random().toString())])));
		}
		const ownersAddresses = owners.map(owner => toAddress(owner.address));
		const singletonToUse = factory == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP;
		const singletonFactory = hexToBigInt(singletonToUse);
		const argInitializers = generateArgInitializers(
			ownersAddresses,
			threshold,
			zeroAddress,
			getFallbackHandler(singletonToUse, false),
			singletonToUse
		);
		const bytecode = encodePacked(['bytes', 'uint256'], [GNOSIS_SAFE_PROXY_CREATION_CODE, singletonFactory]);
		const result = await compute({
			argInitializers,
			bytecode,
			prefix: shouldUseExpertMode ? '' : prefix,
			suffix: shouldUseExpertMode ? '' : suffix,
			seed
		});
		if (shouldCancel.current) {
			shouldCancel.current = false;
			onParamChange();
			setIsLoadingSafes(false);
			return;
		}
		shouldCancel.current = false;
		setSafeAddress(result.address);
		setCurrentSeed(result.salt);
		setIsLoadingSafes(false);
	}, [
		currentSeed,
		shouldUseExpertMode,
		safeAddress,
		owners,
		threshold,
		factory,
		compute,
		prefix,
		suffix,
		onParamChange
	]);

	return (
		<div className={'grid w-full max-w-[600px]'}>
			<div className={'-mt-2 mb-6 flex flex-wrap gap-2 text-xs'}>
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
					variant={shouldUseExpertMode ? 'filled' : 'light'}
					onClick={() => setShouldUseExpertMode(!shouldUseExpertMode)}>
					<IconFire className={'mr-2 size-3'} />
					{'Use expert mode'}
				</Button>
			</div>
			<div className={'grid w-full max-w-[600px] gap-6'}>
				<div className={'w-full'}>
					<div className={'mb-2'}>
						<p className={'text-sm font-medium md:text-base'}>{'Owners'}</p>
					</div>
					<div className={'grid gap-4'}>
						{owners.map((owner, index) => (
							<SafeOwner
								key={index}
								owner={owner}
								removeOwner={(): void => {
									onParamChange();
									onRemoveOwner(owner.UUID);
								}}
								updateOwner={(value): void => {
									onParamChange();
									onUpdateOwner(owner.UUID, {
										...value,
										UUID: owner.UUID
									} as TInputAddressLikeWithUUID);
								}}
							/>
						))}
					</div>
					<div className={'mb-2 mt-4'}>
						<button
							className={cl(
								'rounded-lg bg-neutral-200 px-5 py-2 text-xs text-neutral-7000',
								'transition-colors hover:bg-neutral-30'
							)}
							onClick={(): void => {
								onParamChange();
								onAddOwner();
							}}>
							{'+ Add owner'}
						</button>
					</div>
				</div>

				<div className={'w-full max-w-[552px]'}>
					<div className={'mb-2'}>
						<p className={'text-sm font-medium md:text-base'}>{'Customization'}</p>
					</div>
					<div className={'full grid max-w-full grid-cols-1 gap-y-4 md:grid-cols-3 md:gap-x-4 md:gap-y-0'}>
						<div>
							<small>{'Threshold'}</small>
							<div
								className={cl(
									'h-12 w-full max-w-full md:max-w-[188px] rounded-lg p-2',
									'flex flex-row items-center justify-between cursor-text',
									'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
								)}>
								<button
									className={cl(
										'h-full aspect-square rounded-lg flex items-center justify-center',
										'text-lg text-center text-neutral-600 hover:text-neutral-0',
										'bg-neutral-300 hover:bg-neutral-900',
										'transition-all opacity-100',
										'disabled:opacity-0'
									)}
									disabled={threshold <= 1}
									onClick={(): void => {
										onParamChange();
										onUpdateThreshold(threshold - 1);
									}}>
									{'-'}
								</button>
								<p className={'font-number font-medium'}>
									{threshold}
									<span className={'text-neutral-600'}>{` / ${owners.length}`}</span>
								</p>
								<button
									type={'button'}
									className={cl(
										'h-full aspect-square rounded-lg flex items-center justify-center',
										'text-lg text-center text-neutral-600 hover:text-neutral-0',
										'bg-neutral-300 hover:bg-neutral-900',
										'transition-all opacity-100',
										'disabled:opacity-0'
									)}
									disabled={threshold >= owners.length}
									onClick={(): void => {
										onParamChange();
										onUpdateThreshold(threshold + 1);
									}}>
									{'+'}
								</button>
							</div>
						</div>

						{shouldUseExpertMode ? (
							<div className={'col-span-1 md:col-span-2'}>
								<small>{'Seed'}</small>
								<div
									className={cl(
										'h-12 w-full rounded-lg p-2',
										'flex flex-row items-center justify-between cursor-text',
										'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
									)}>
									<input
										onChange={(e): void => {
											const {value} = e.target;
											onParamChange();
											setCurrentSeed(toBigInt(value.replace(/\D/g, '')));
										}}
										type={'text'}
										value={currentSeed ? currentSeed.toString() : undefined}
										pattern={'[0-9]{0,512}$'}
										className={'smol--input font-mono font-bold'}
									/>
								</div>
							</div>
						) : (
							<Fragment>
								<div>
									<small>{'Prefix'}</small>
									<div
										className={cl(
											'h-12 w-full max-w-full md:max-w-[188px] rounded-lg p-2',
											'flex flex-row items-center justify-between cursor-text',
											'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
										)}>
										<input
											id={'prefix'}
											onChange={(e): void => {
												let {value} = e.target;
												value = value.replaceAll('[^a-fA-F0-9]', '');
												if (value === '0') {
													value = '0x';
												}
												if (!value || value === '0x' || value === '0X') {
													onParamChange();
													setPrefix(undefined);
													const input = document.getElementById('prefix') as HTMLInputElement;
													if (input) {
														input.value = '';
													}
												} else if (value.length <= 6) {
													if (!value || value === '0x' || value === '0X') {
														onParamChange();
														setPrefix(undefined);
													} else if (value.match(/^0x[a-fA-F0-9]{0,6}$/)) {
														onParamChange();
														setPrefix(value.replace('0x', ''));
													} else if (
														value.match(/^[a-fA-F0-9]{0,4}$/) &&
														!value.startsWith('0x')
													) {
														onParamChange();
														setPrefix(value.replace('0x', ''));
													}
												}
											}}
											placeholder={'0x'}
											type={'text'}
											value={`0x${prefix || ''}`}
											pattern={'^0x[a-fA-F0-9]{0,6}$'}
											className={cl(
												'smol--input font-mono font-bold',
												!prefix ? '!text-neutral-600' : ''
											)}
										/>
									</div>
								</div>

								<div>
									<small>{'Suffix'}</small>
									<div
										className={cl(
											'h-12 w-full max-w-full md:max-w-[188px] rounded-lg p-2',
											'flex flex-row items-center justify-between cursor-text',
											'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
										)}>
										<input
											onChange={(e): void => {
												const {value} = e.target;
												if (value.length <= 4) {
													if (value.match(/^[a-fA-F0-9]{0,4}$/)) {
														onParamChange();
														setSuffix(value);
													}
												}
											}}
											type={'text'}
											value={suffix}
											pattern={'[a-fA-F0-9]{0,6}$'}
											className={'smol--input font-mono font-bold'}
										/>
									</div>
								</div>
							</Fragment>
						)}

						{shouldUseExpertMode && (
							<div className={'col-span-1 md:col-span-3'}>
								<small className={'md:mt-4'}>{'Factory'}</small>
								<div
									className={cl(
										'col-span-3',
										'h-12 w-full rounded-lg p-2',
										'flex flex-row items-center justify-between cursor-text',
										'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
									)}>
									<select
										className={'smol--input font-mono font-bold'}
										value={factory}
										onChange={(e): void => {
											assert(['ssf', 'ddp'].includes(e.target.value));
											onParamChange();
											setFactory(e.target.value as 'ssf' | 'ddp');
										}}>
										<option value={'ssf'}>{'Safe Singleton Factory'}</option>
										<option value={'ddp'}>{'Deterministic Deployment Proxy'}</option>
									</select>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className={'flex flex-col'}>
					<div className={'w-full max-w-[552px]'}>
						<ConfigurationStatus
							owners={owners}
							threshold={threshold}
						/>
					</div>
					<div className={'flex gap-2'}>
						<Button
							className={'group !h-8 w-auto'}
							variant={'light'}
							isBusy={isLoadingSafes}
							isDisabled={owners.some((owner): boolean => !owner || isZeroAddress(owner.address))}
							onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
								e.currentTarget.blur();
								shouldCancel.current = false;
								generateCreate2Addresses();
							}}>
							<p className={'text-sm'}>{'Generate'}</p>
							{isLoadingSafes ? (
								<span
									onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
										e.currentTarget.blur();
										shouldCancel.current = true;
									}}
									className={cl(
										'hover:!text-neutral-900 absolute inset-0 z-50 flex items-center justify-center',
										'transition-colors hover:cursor-pointer hover:bg-primaryHover rounded-lg'
									)}>
									<p className={'text-sm'}>{'Cancel'}</p>
								</span>
							) : null}
						</Button>
					</div>
					{safeAddress && !isLoadingSafes ? (
						<div className={'box-0 mt-6 grid gap-4 !bg-neutral-200 p-4'}>
							<div>
								<p className={'font-medium'}>{'We found a safe for you!'}</p>
							</div>
							<ReadonlySmolAddressInput value={safeAddress} />
							<div>
								<Button
									onClick={navigateToDeploy}
									className={'group !h-8 w-auto md:min-w-[160px]'}>
									<p className={'text-sm'}>{'Choose network & deploy'}</p>
								</Button>
							</div>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

export default function MultisafeNewWrapper(): ReactElement {
	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}
