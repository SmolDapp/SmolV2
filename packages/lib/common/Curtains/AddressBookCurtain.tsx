'use client';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {AddressBookStatus} from 'packages/smol/components/AddressBook/AddressBookStatus';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl, isAddress, toAddress, toSafeAddress} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';
import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {IconEdit} from '@lib/icons/IconEdit';
import {IconGears} from '@lib/icons/IconGears';
import {IconHeart, IconHeartFilled} from '@lib/icons/IconHeart';
import {IconLinkOut} from '@lib/icons/IconLinkOut';
import {IconTrash} from '@lib/icons/IconTrash';
import {Button} from '@lib/primitives/Button';
import {CurtainContent} from '@lib/primitives/Curtain';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {supportedNetworks} from '@lib/utils/tools.chains';

import {AvatarWrapper} from '../Avatar';
import {NetworkDropdownSelector} from '../NetworkSelector/Dropdown';
import {SmolAddressInput} from '../SmolAddressInput';
import {SmolNameInput} from '../SmolNameInput';

import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TAddressBookEntry, TAddressBookEntryReducer} from '@lib/types/AddressBook';
import type {TInputAddressLike} from '@lib/utils/tools.address';

function FavoriteToggle(props: {isFavorite: boolean; onClick: () => void}): ReactElement {
	return (
		<button
			tabIndex={2}
			role={'switch'}
			onClick={e => {
				e.stopPropagation();
				e.preventDefault();
				props.onClick();
			}}
			className={cl('rounded p-1', 'h-full w-12 rounded-lg bg-neutral-300', 'flex justify-center items-center')}>
			<div className={'group relative flex size-4 items-center justify-center'}>
				<IconHeart
					className={cl(
						'absolute h-4 w-4 transition-colors',
						props.isFavorite
							? 'text-transparent group-hover:text-neutral-600'
							: 'text-neutral-600 group-hover:text-transparent'
					)}
				/>
				<IconHeartFilled
					className={cl(
						'absolute h-4 w-4 transition-colors',
						props.isFavorite ? 'text-neutral-600' : 'text-transparent group-hover:text-neutral-600'
					)}
				/>
			</div>
		</button>
	);
}

function ActionButtons(props: {
	selectedEntry: TAddressBookEntry;
	dispatch: Dispatch<TAddressBookEntryReducer>;
	isEditMode: boolean;
	onOpenChange: (props: {isOpen: boolean; isEditing: boolean}) => void;
	onEdit: Dispatch<SetStateAction<boolean>>;
}): ReactElement {
	const {deleteEntry} = useAddressBook();

	const onDelete = useCallback(() => {
		if (props.selectedEntry.address) {
			deleteEntry(props.selectedEntry.address);
		}
		props.onOpenChange({isOpen: false, isEditing: false});
	}, [props, deleteEntry]);

	return (
		<div className={'flex gap-2'}>
			<button
				className={'withRing -m-1 rounded p-1'}
				onClick={() => props.onEdit(isEditMode => !isEditMode)}>
				<IconEdit
					className={cl(
						'h-4 w-4 transition-colors hover:text-neutral-900',
						props.isEditMode ? 'text-neutral-900' : 'text-neutral-600'
					)}
				/>
			</button>

			{props.isEditMode ? (
				<div className={'size-4'}>
					<NetworkDropdownSelector
						disabled={!props.isEditMode}
						value={props.selectedEntry.chains}
						onChange={chains => {
							props.dispatch({type: 'SET_CHAINS', payload: chains});
						}}>
						<IconGears
							className={'mb-0.5 size-4 text-neutral-600 transition-colors hover:text-neutral-900'}
						/>
					</NetworkDropdownSelector>
				</div>
			) : (
				<button
					className={'withRing -m-1 rounded p-1'}
					onClick={onDelete}>
					<IconTrash className={'size-4 text-neutral-600 transition-colors hover:text-neutral-900'} />
				</button>
			)}
		</div>
	);
}

function NameInput(props: {
	selectedEntry: TAddressBookEntry;
	isEditMode: boolean;
	onEdit: (shouldEdit: boolean) => void;
	onRefresh?: VoidFunction;
	set_isValid?: (valud: boolean | 'undetermined') => void;
}): ReactElement {
	const labelRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div
			ref={labelRef}
			onDoubleClick={() => {
				props.onEdit(true);
			}}>
			<SmolNameInput
				inputRef={inputRef}
				id={'name'}
				disabled={!props.isEditMode}
				set_isValid={props.set_isValid}
			/>
		</div>
	);
}

function AddressInput(props: {
	selectedEntry: TAddressBookEntry;
	isEditMode: boolean;
	onEdit: (shouldEdit: boolean) => void;
	onChangeAddressLike: (addressLike: Partial<TInputAddressLike>) => void;
	addressLike: TInputAddressLike;
	onRefresh?: VoidFunction;
}): ReactElement {
	const inputRef = useRef<HTMLInputElement>(null);
	const addressRef = useRef<HTMLDivElement>(null);
	const {onChangeAddressLike, selectedEntry} = props;

	useEffect(() => {
		onChangeAddressLike({
			address: selectedEntry.address,
			label: toSafeAddress({
				address: selectedEntry.address,
				ens: selectedEntry.ens
			}),
			isValid: isAddress(selectedEntry.address) ? true : 'undetermined',
			source: 'defaultValue'
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedEntry.address, selectedEntry.ens]);

	return (
		<div
			ref={addressRef}
			onDoubleClick={() => {
				props.onEdit(true);
				setTimeout(() => addressRef.current?.focus(), 0);
			}}>
			<div className={'flex items-center justify-between'}>
				<label htmlFor={'address'}>
					<small className={'pl-1'}>{'Address'}</small>
				</label>
			</div>

			<SmolAddressInput
				id={'address'}
				inputRef={inputRef}
				disabled={!props.isEditMode}
				required
				isSimple
				value={props.addressLike}
				onSetValue={(input: Partial<TInputAddressLike>) => {
					onChangeAddressLike(input);
				}}
			/>
		</div>
	);
}

export function AddressBookCurtain(props: {
	selectedEntry: TAddressBookEntry;
	dispatch: Dispatch<TAddressBookEntryReducer>;
	isOpen: boolean;
	isEditing: boolean;
	initialLabel?: string;
	onOpenChange: (props: {isOpen: boolean; isEditing: boolean}) => void;
}): ReactElement {
	const router = useRouter();
	const plausible = usePlausible();
	const {updateEntry, listCachedEntries, set_curtainStatus} = useAddressBook();
	const formRef = useRef<HTMLFormElement>(null);
	const {safeChainID} = useChainID();
	const [currentEntry, set_currentEntry] = useState<TAddressBookEntry>(props.selectedEntry);
	const [isEditMode, set_isEditMode] = useState<boolean>(props.isEditing);
	const [addressLike, set_addressLike] = useState<TInputAddressLike>({
		address: props.selectedEntry.address,
		label: toSafeAddress({
			address: props.selectedEntry.address,
			ens: props.selectedEntry.ens,
			addrOverride: props.selectedEntry.address?.substring(0, 6)
		}),
		isValid: isAddress(props.selectedEntry.address) ? true : 'undetermined',
		source: 'defaultValue'
	});
	const [isFormValid, set_isFormValid] = useState<boolean>(false);
	const [isValidName, set_isValidName] = useState<boolean | 'undetermined'>(false);

	const currentNetwork = useMemo(
		() => supportedNetworks.find((network): boolean => network.id === safeChainID),
		[safeChainID]
	);

	/**********************************************************************************************
	 ** We need to use this useEffect to prevent an UI issue where the address input is not updated
	 ** directly in all places and because of this, an relicated error message is shown.
	 **********************************************************************************************/

	const onFormSubmit = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!isEditMode) {
				const URLQueryParam = new URLSearchParams();
				URLQueryParam.set('to', toAddress(addressLike.address));
				return router.push({
					pathname: '/apps/send',
					query: URLQueryParam.toString()
				});
			}
			if (props.selectedEntry.id === undefined) {
				updateEntry({...currentEntry, address: addressLike.address, isHidden: false});
				props.onOpenChange({isOpen: false, isEditing: false});
				if (listCachedEntries().length === 0) {
					plausible(PLAUSIBLE_EVENTS.AB_ADD_FIRST_CONTACT);
				}
			} else {
				updateEntry({...currentEntry, address: addressLike.address, isHidden: false});
				set_isEditMode(false);
				props.onOpenChange({isOpen: true, isEditing: false});
			}
			return;
		},
		[isEditMode, props, addressLike.address, router, updateEntry, currentEntry, listCachedEntries, plausible]
	);

	const onResetAddressLike = useAsyncTrigger(async () => {
		set_addressLike({
			address: props.selectedEntry.address,
			label: toSafeAddress({
				address: props.selectedEntry.address,
				ens: props.selectedEntry.ens,
				addrOverride: props.selectedEntry.address?.substring(0, 6)
			}),
			isValid: isAddress(props.selectedEntry.address) ? true : 'undetermined',
			source: 'defaultValue'
		});
	}, [props.selectedEntry.address, props.selectedEntry.ens]);

	const onChangeValue = (value: Partial<TInputAddressLike>): void => {
		set_addressLike(prev => ({...prev, ...value}));
	};

	/**********************************************************************************************
	 ** If some of the props change, we need to update the local state to reflect the changes. We
	 ** don't want to do it for every prop, only for the ones that are important for the component.
	 **********************************************************************************************/
	useEffect(() => set_currentEntry(props.selectedEntry), [props.selectedEntry]);
	useEffect(() => set_isEditMode(props.isEditing), [props.isEditing]);
	useEffect(() => set_currentEntry(prev => ({...prev, label: props.initialLabel ?? ''})), [props.initialLabel]);

	const isDisabledAddButton = useMemo(
		() => !(addressLike.isValid === true && isFormValid && isValidName && isValidName !== 'undetermined'),
		[addressLike.isValid, isFormValid, isValidName]
	);

	return (
		<Dialog.Root
			key={`${props.selectedEntry.id}`}
			open={props.isOpen}
			onOpenChange={isOpen => {
				if (!isOpen) {
					formRef.current?.reset();
				}
				props.onOpenChange({isOpen, isEditing: isEditMode});
			}}>
			<CurtainContent className={'focus:!border-green'}>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<button
						aria-label={'Hack to prevent focus on fav on mount'}
						className={'pointer-events-none size-0 opacity-0'}
						tabIndex={0}
					/>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<ActionButtons
							{...props}
							isEditMode={isEditMode}
							onEdit={set_isEditMode}
						/>
						<CloseCurtainButton />
					</div>

					<div className={'flex items-center justify-center pb-6'}>
						<AvatarWrapper address={addressLike.address || toAddress(currentEntry.address)} />
					</div>

					<form
						ref={formRef}
						onSubmit={onFormSubmit}
						className={'flex flex-col gap-6'}>
						<div className={'flex flex-col items-center space-x-0'}>
							<div className={'w-full'}>
								<div className={'flex items-center justify-between'}>
									<label htmlFor={'name'}>
										<small className={'pl-1'}>{'Name'}</small>
									</label>
								</div>
							</div>
							<div className={'flex'}>
								<NameInput
									{...props}
									selectedEntry={currentEntry}
									isEditMode={isEditMode}
									onEdit={set_isEditMode}
									set_isValid={set_isValidName}
								/>
								<small className={'pl-1'}>&nbsp;</small>
								<div>
									<FavoriteToggle
										isFavorite={Boolean(currentEntry.isFavorite)}
										onClick={() =>
											props.dispatch({
												type: 'SET_IS_FAVORITE',
												payload: !currentEntry.isFavorite
											})
										}
									/>
								</div>
							</div>
						</div>

						<AddressInput
							{...props}
							selectedEntry={currentEntry}
							addressLike={addressLike}
							isEditMode={isEditMode}
							onEdit={set_isEditMode}
							onChangeAddressLike={onChangeValue}
						/>
						<AddressBookStatus
							set_isFormValid={set_isFormValid}
							addressLike={addressLike}
						/>

						<div className={'flex flex-row items-center gap-2'}>
							<Button
								tabIndex={0}
								type={'submit'}
								isDisabled={isDisabledAddButton}
								className={'!h-8 w-1/2 !text-xs font-medium'}>
								<b>{isEditMode ? (currentEntry.id === undefined ? 'Add' : 'Save') : 'Send'}</b>
							</Button>
							{isEditMode ? (
								<Button
									onClick={async () => {
										if (props.selectedEntry) {
											set_currentEntry(props.selectedEntry);
											onResetAddressLike();
											set_isEditMode(false);
										}
										set_curtainStatus({isOpen: false, isEditing: false});
									}}
									type={'button'}
									variant={'light'}
									className={'!h-8 w-1/2 !text-xs'}>
									{'Cancel'}
								</Button>
							) : null}
						</div>
					</form>
					{addressLike.address && (
						<Link
							href={`${currentNetwork?.blockExplorers?.default.url}/address/${addressLike.address}`}
							target={'_blank'}
							className={
								'absolute bottom-4 flex items-center gap-x-2 text-neutral-600 transition-colors hover:text-neutral-900'
							}>
							<IconLinkOut className={'size-4'} />
							<p className={'text-sm '}>{'View on Block Explorer'}</p>
						</Link>
					)}
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
