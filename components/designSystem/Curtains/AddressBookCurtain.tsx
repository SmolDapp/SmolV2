'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {CloseCurtainButton} from 'components/designSystem/Curtains/InfoCurtain';
import {Button} from 'components/Primitives/Button';
import {CurtainContent} from 'components/Primitives/Curtain';
import {TextInput} from 'components/Primitives/TextInput';
import {useAddressBook} from 'contexts/useAddressBook';
import {useAsyncTrigger} from '@builtbymom/web3/hooks/useAsyncTrigger';
import {cl, isAddress, toAddress, toSafeAddress} from '@builtbymom/web3/utils';
import {IconEdit} from '@icons/IconEdit';
import {IconGears} from '@icons/IconGears';
import {IconHeart, IconHeartFilled} from '@icons/IconHeart';
import {IconTrash} from '@icons/IconTrash';
import * as Dialog from '@radix-ui/react-dialog';

import {AvatarWrapper} from '../Avatar';
import {NetworkDropdownSelector} from '../NetworkSelector/Dropdown';
import {SmolAddressInput} from '../SmolAddressInput';

import type {TAddressBookEntry, TAddressBookEntryReducer} from 'contexts/useAddressBook';
import type {Dispatch, ReactElement, SetStateAction} from 'react';
import type {TInputAddressLike} from '@utils/tools.address';

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
			className={cl('rounded p-1', 'h-12 w-12 rounded-lg bg-neutral-300', 'flex justify-center items-center')}>
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
	onChange: (value: string) => void;
	onRefresh?: VoidFunction;
}): ReactElement {
	const {getCachedEntry} = useAddressBook();
	const labelRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const {onChange, selectedEntry} = props;

	useEffect(() => {
		const entry = getCachedEntry({label: selectedEntry.label});
		const currentCustomValidity = inputRef.current?.validationMessage;
		if (entry !== undefined && entry.id !== selectedEntry.id && !entry.isHidden) {
			inputRef.current?.setCustomValidity('This name is already used in your address book');
			props.onRefresh?.();
		} else if (currentCustomValidity !== '') {
			inputRef.current?.setCustomValidity('');
			props.onRefresh?.();
		}
	}, [selectedEntry.label, getCachedEntry, selectedEntry.id, onChange, props]);

	const getErrorMessage = useCallback((): string | undefined => {
		if (selectedEntry.label.startsWith('0x')) {
			return 'The name cannot starts with `0x`';
		}
		if (selectedEntry.label.length > 22) {
			return 'The name cannot be longer than 22 characters';
		}
		if (inputRef.current?.validity.patternMismatch) {
			return 'The string must not start with `0x` and must not contain `.`';
		}
		if (inputRef.current?.validity.tooShort) {
			return 'The name must be at least 1 character long';
		}
		if (inputRef.current?.validity.tooLong) {
			return 'The name cannot be longer than 22 characters';
		}
		if (inputRef.current?.validationMessage) {
			return inputRef.current?.validationMessage;
		}
		return undefined;
	}, [selectedEntry.label, inputRef]);

	return (
		<div
			ref={labelRef}
			onDoubleClick={() => {
				props.onEdit(true);
				setTimeout(() => labelRef.current?.focus(), 0);
			}}>
			<div className={'flex items-center justify-between'}>
				<label htmlFor={'name'}>
					<small className={'pl-1'}>{'Name'}</small>
				</label>
				<small className={'pr-1 text-red'}>{getErrorMessage()}</small>
			</div>
			<TextInput
				inputRef={inputRef}
				disabled={!props.isEditMode}
				id={'name'}
				placeholder={'Mom'}
				pattern={'^(?!0x).*'}
				title={"The string must not start with '0x'"}
				tabIndex={0}
				minLength={1}
				maxLength={22}
				aria-invalid={selectedEntry.label.startsWith('0x') || selectedEntry.label.length > 22}
				value={selectedEntry.label}
				onChange={onChange}
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
	const {onChangeAddressLike, onRefresh, selectedEntry} = props;
	const {getCachedEntry} = useAddressBook();

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

	useEffect(() => {
		const entry = getCachedEntry({address: props.addressLike.address});
		const currentCustomValidity = inputRef.current?.validationMessage;

		if (entry !== undefined && entry.id !== props.selectedEntry.id && !entry.isHidden) {
			inputRef.current?.setCustomValidity('This address is already in your address book');
			onRefresh?.();
		} else if (currentCustomValidity !== '') {
			inputRef.current?.setCustomValidity('');
			onRefresh?.();
		}
	}, [getCachedEntry, onRefresh, props.addressLike.address, props.selectedEntry.id]);

	const getErrorMessage = useCallback((): string | undefined => {
		if (props.addressLike.isValid === 'undetermined') {
			return undefined;
		}
		if (inputRef.current?.validationMessage) {
			return inputRef.current?.validationMessage;
		}
		return undefined;
	}, [props.addressLike.isValid, inputRef]);

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
				<small className={'pr-1 text-red'}>{getErrorMessage()}</small>
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
	const {updateEntry, listCachedEntries} = useAddressBook();
	const formRef = useRef<HTMLFormElement>(null);
	const [currentEntry, set_currentEntry] = useState<TAddressBookEntry>(props.selectedEntry);
	const [, set_nonce] = useState<number>(0);
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

	/**********************************************************************************************
	 ** We need to use this useEffect to prevent an UI issue where the address input is not updated
	 ** directly in all places and because of this, an relicated error message is shown.
	 **********************************************************************************************/
	useEffect(() => {
		setTimeout(() => set_nonce(n => n + 1), 100);
	}, [props.selectedEntry.address, props.selectedEntry.ens]);

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
					plausible('add 1st ab contact');
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
					className={'flex h-full flex-col overflow-y-hidden bg-neutral-0 p-6'}>
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
						className={'flex h-full flex-col gap-6'}>
						<div className={'flex flex-row items-center space-x-0'}>
							<div className={'w-full'}>
								<NameInput
									{...props}
									selectedEntry={currentEntry}
									isEditMode={isEditMode}
									onEdit={set_isEditMode}
									onRefresh={() => set_nonce(n => n + 1)}
									onChange={(label: string) => {
										set_currentEntry({...currentEntry, label});
										props.dispatch({type: 'SET_LABEL', payload: label});
									}}
								/>
							</div>
							<div className={'pl-2'}>
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
							onRefresh={() => set_nonce(n => n + 1)}
							onChangeAddressLike={onChangeValue}
						/>

						<div className={'flex flex-row items-center gap-2'}>
							<Button
								tabIndex={0}
								type={'submit'}
								isDisabled={!(formRef.current?.checkValidity() && addressLike.isValid === true)}
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
									}}
									type={'button'}
									variant={'light'}
									className={'!h-8 w-1/2 !text-xs'}>
									{'Cancel'}
								</Button>
							) : null}
						</div>
					</form>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
