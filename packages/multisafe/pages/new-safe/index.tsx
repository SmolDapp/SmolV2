import React, {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import assert from 'assert';
import {concat, encodePacked, getContractAddress, hexToBigInt, keccak256, toHex} from 'viem';
import {serialize} from 'wagmi';
import {cl, isZeroAddress, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {ConfigurationStatus} from '@multisafe/components/ConfigurationStatus';
import {MultisafeContextApp, useMultisafe} from '@multisafe/contexts/useMultisafe';
import {
	GNOSIS_SAFE_PROXY_CREATION_CODE,
	PROXY_FACTORY_L2,
	PROXY_FACTORY_L2_DDP,
	SINGLETON_L2,
	SINGLETON_L2_DDP
} from '@multisafeUtils/constants';
import {createUniqueID, generateArgInitializers} from '@multisafeUtils/utils';
import {SmolAddressInput} from '@lib/common/SmolAddressInput';
import {IconCross} from '@lib/icons/IconCross';
import {IconDoc} from '@lib/icons/IconDoc';
import {IconFire} from '@lib/icons/IconFire';
import {Button} from '@lib/primitives/Button';

import type {GetServerSideProps} from 'next';
import type {ReactElement} from 'react';
import type {Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TInputAddressLikeWithUUID} from '@multisafe/contexts/useMultisafe';
import type {TInputAddressLike} from '@multisafeCommons/AddressInput';

function SafeOwner(props: {
	owner: TInputAddressLike;
	updateOwner: (value: Partial<TInputAddressLike>) => void;
	removeOwner: () => void;
}): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className={'flex w-full max-w-full'}>
			<SmolAddressInput
				inputRef={inputRef}
				onSetValue={props.updateOwner}
				value={props.owner}
			/>
			<button
				className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}
				onClick={props.removeOwner}>
				<IconCross className={'size-4'} />
			</button>
		</div>
	);
}

function Safe(): ReactElement {
	const router = useRouter();
	const {threshold, onUpdateThreshold, owners, onAddOwner, onSetOwners, onUpdateOwner, onRemoveOwner} =
		useMultisafe();
	const uniqueIdentifier = useRef<string | undefined>(undefined);
	const [safeAddress, set_safeAddress] = useState<TAddress | undefined>(undefined);
	const [prefix, set_prefix] = useState<string | undefined>(undefined);
	const [suffix, set_suffix] = useState('');
	const [seed, set_seed] = useState<bigint | undefined>(undefined);
	const [factory, set_factory] = useState<'ssf' | 'ddp'>('ssf');
	const [shouldUseExpertMode, set_shouldUseExpertMode] = useState<boolean>(false);
	const shouldCancel = useRef(false);
	const [isLoadingSafes, set_isLoadingSafes] = useState(false);
	const [currentSeed, set_currentSeed] = useState(0n);

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
		const {address, owners, threshold, singleton, salt} = router.query;
		if (address && !isZeroAddress(address as string)) {
			set_safeAddress(toAddress(address as string));
		}
		if (owners) {
			onSetOwners((owners as string).split('_').map(toAddress));
		}
		if (threshold) {
			onUpdateThreshold(parseInt(threshold as string, 10));
		}
		if (singleton) {
			assert(['ssf', 'ddp'].includes(singleton as string));
			set_factory(singleton as 'ssf' | 'ddp');
		}
		if (salt) {
			set_currentSeed(toBigInt(salt as string));
		}
		uniqueIdentifier.current = createUniqueID(serialize(router.query));
	}, [onSetOwners, onUpdateThreshold, router.query]);

	/**********************************************************************************************
	 ** The navigateToDeploy function is used to navigate to the /deploy route with the query
	 ** arguments generated from the linkToDeploy URLSearchParams object.
	 ** One little trick here is that we are first replacing the current URL with the new query
	 ** arguments in order to update the browser history. Thanks to this, the user can navigate
	 ** back to this page and the form will be populated with the same values.
	 *********************************************************************************************/
	const navigateToDeploy = useCallback(() => {
		const thisPageUpdatedQueryURL = linkToDeploy;
		thisPageUpdatedQueryURL.set('address', toAddress(safeAddress));
		router.replace(`/new-safe?${thisPageUpdatedQueryURL.toString()}`);
		router.push(`/new-safe/${safeAddress}?${linkToDeploy.toString()}`);
	}, [linkToDeploy, router, safeAddress]);

	/**********************************************************************************************
	 ** The onParamChange function is used to reset the safeAddress state when the parameters
	 ** of the form are changed. This is to ensure that the user is aware that the address
	 ** will be recomputed.
	 ** If this function is called when the user is generating a new address, the computation
	 ** will be cancelled.
	 *********************************************************************************************/
	const onParamChange = useCallback(() => {
		set_safeAddress(undefined);
		shouldCancel.current = true;
	}, []);

	const compute = useCallback(
		async ({
			argInitializers,
			bytecode,
			prefix,
			suffix,
			saltNonce
		}: {
			argInitializers: string;
			bytecode: Hex;
			prefix: string;
			suffix: string;
			saltNonce: bigint;
		}): Promise<{address: TAddress; salt: bigint}> => {
			if (shouldCancel.current) {
				return {address: '' as TAddress, salt: 0n};
			}
			const salt = keccak256(encodePacked(['bytes', 'uint256'], [keccak256(`0x${argInitializers}`), saltNonce]));
			const addrCreate2 = getContractAddress({
				bytecode,
				from: factory == 'ssf' ? PROXY_FACTORY_L2 : PROXY_FACTORY_L2_DDP,
				opcode: 'CREATE2',
				salt
			});
			if (addrCreate2.startsWith(prefix) && addrCreate2.endsWith(suffix)) {
				return {address: addrCreate2, salt: saltNonce};
			}
			const newSalt = hexToBigInt(keccak256(concat([toHex('smol'), toHex(Math.random().toString())])));
			set_currentSeed(newSalt);
			await new Promise(resolve => setTimeout(resolve, 0));
			return compute({argInitializers, bytecode, prefix, suffix, saltNonce: newSalt});
		},
		[shouldCancel, factory]
	);

	const generateCreate2Addresses = useCallback(async (): Promise<void> => {
		set_safeAddress(undefined);
		const salt = currentSeed;

		set_isLoadingSafes(true);
		const ownersAddresses = owners.map(owner => toAddress(owner.address));
		const argInitializers = generateArgInitializers(ownersAddresses, threshold);
		const singletonFactory = hexToBigInt(factory == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP);
		const bytecode = encodePacked(['bytes', 'uint256'], [GNOSIS_SAFE_PROXY_CREATION_CODE, singletonFactory]);
		const result = await compute({
			argInitializers,
			bytecode,
			prefix: prefix || '0x',
			suffix,
			saltNonce: salt
		});
		if (shouldCancel.current) {
			shouldCancel.current = false;
			onParamChange();
			set_isLoadingSafes(false);
			return;
		}
		shouldCancel.current = false;
		set_safeAddress(result.address);
		set_currentSeed(result.salt);
		set_isLoadingSafes(false);
	}, [onParamChange, currentSeed, owners, threshold, factory, compute, prefix, suffix]);

	return (
		<div className={'grid w-full max-w-[600px]'}>
			<div className={'-mt-2 mb-6 flex flex-wrap gap-2 text-xs'}>
				<Button
					className={'!h-8 !text-xs'}
					variant={'light'}
					onClick={() => {
						// plausible('download template');
						// downloadTemplate();
					}}>
					<IconDoc className={'mr-2 size-3'} />
					{'View FAQ'}
				</Button>
				<Button
					className={'!h-8 !text-xs'}
					variant={shouldUseExpertMode ? 'filled' : 'light'}
					onClick={() => set_shouldUseExpertMode(!shouldUseExpertMode)}>
					<IconFire className={'mr-2 size-3'} />
					{'Use expert mode'}
				</Button>
			</div>
			<div className={'grid w-full max-w-[600px] gap-6'}>
				<div className={'w-full'}>
					<div className={'mb-2'}>
						<p className={'font-medium'}>{'Owners'}</p>
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
						<p className={'font-medium'}>{'Customization'}</p>
					</div>
					<div className={'full grid max-w-full grid-cols-3 gap-x-4'}>
						<small>{'Threshold'}</small>
						<small>{'Prefix'}</small>
						<small>{'Suffix'}</small>

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
									if (!value || value === '0x' || value === '0X') {
										onParamChange();
										set_prefix(undefined);
										const input = document.getElementById('prefix') as HTMLInputElement;
										if (input) {
											input.value = '';
										}
									} else if (value.length <= 6) {
										if (!value || value === '0x' || value === '0X') {
											onParamChange();
											set_prefix(undefined);
										} else if (value.match(/^0x[a-fA-F0-9]{0,6}$/)) {
											onParamChange();
											set_prefix(value);
										} else if (value.match(/^[a-fA-F0-9]{0,4}$/) && !value.startsWith('0x')) {
											onParamChange();
											set_prefix(`0x${value}`);
										}
									}
								}}
								placeholder={'0x'}
								type={'text'}
								value={prefix}
								pattern={'^0x[a-fA-F0-9]{0,6}$'}
								className={'smol--input font-mono font-bold'}
							/>
						</div>

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
											set_suffix(value);
										}
									}
								}}
								type={'text'}
								value={suffix}
								pattern={'[a-fA-F0-9]{0,6}$'}
								className={'smol--input font-mono font-bold'}
							/>
						</div>

						{shouldUseExpertMode && (
							<Fragment>
								<small className={'mt-4'}>{'Seed'}</small>
								<div
									className={cl(
										'col-span-3',
										'h-12 w-full rounded-lg p-2',
										'flex flex-row items-center justify-between cursor-text',
										'border border-neutral-400 focus-within:border-neutral-600 transition-colors'
									)}>
									<input
										onChange={(e): void => {
											const {value} = e.target;
											onParamChange();
											set_seed(toBigInt(value.replace(/\D/g, '')));
										}}
										type={'text'}
										value={seed ? seed.toString() : undefined}
										pattern={'[0-9]{0,512}$'}
										className={'smol--input font-mono font-bold'}
									/>
								</div>

								<small className={'mt-4'}>{'Factory'}</small>
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
											set_factory(e.target.value as 'ssf' | 'ddp');
										}}>
										<option value={'ssf'}>{'Safe Singleton Factory'}</option>
										<option value={'ddp'}>{'Deterministic Deployment Proxy'}</option>
									</select>
								</div>
							</Fragment>
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
						{safeAddress && !isLoadingSafes ? (
							<Button
								onClick={navigateToDeploy}
								className={'group !h-8 w-auto md:min-w-[160px]'}>
								<p className={'text-sm'}>
									{'Deploy: '}
									<span className={'font-number font-medium'}>{`${safeAddress}`}</span>
								</p>
							</Button>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function MultisafeWrapper(): ReactElement {
	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}

MultisafeWrapper.AppName = 'One new Safe, coming right up.';
MultisafeWrapper.AppDescription =
	'Your Safe needs owners. Let us know the other addresses or ENS you want to be in charge of your Safe alongside you.';
MultisafeWrapper.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);

export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
