'use client';

import {TextTruncate} from '@lib/common/TextTruncate';
import {useAddressBook} from '@lib/contexts/useAddressBook';
import {useAsyncTrigger} from '@lib/hooks/useAsyncTrigger';
import {useValidateAddressInput} from '@lib/hooks/web3/useValidateAddressInput';
import {useAsyncAbortable} from '@react-hookz/web';
import {getEnsAddress} from '@wagmi/core';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useOnClickOutside} from 'usehooks-ts';
import {mainnet} from 'viem/chains';
import {useChainId, useConfig} from 'wagmi';

import {IconAppAddressBook} from '@lib/icons/IconApps';
import {IconChevron} from '@lib/icons/IconChevron';
import {IconCircleCheck} from '@lib/icons/IconCircleCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconLoader} from '@lib/icons/IconLoader';
import {IconPlus} from '@lib/icons/IconPlus';
import {cl} from '@lib/utils/helpers';
import {getIsSmartContract, isAddress, isZeroAddress, toAddress, truncateHex} from '@lib/utils/tools.addresses';
import {useSendContext} from 'packages/smol/app/(apps)/send/contexts/useSendContext';

import {AvatarWrapper} from './Avatar';

import type {TAddress, TInputAddressLike} from '@lib/utils/tools.addresses';
import type {InputHTMLAttributes, ReactElement, RefObject} from 'react';
import type {GetEnsAddressReturnType} from 'viem';

type TAddressInput = {
	onSetValue: (value: Partial<TInputAddressLike>) => void;
	value: TInputAddressLike;
	inputRef: RefObject<HTMLInputElement>;
	isSimple?: boolean;
	isSplitted?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

function AddressAvatarButton(props: {address: TAddress; onClick: () => void}): ReactElement {
	return (
		<div className={'w-fit flex-1'}>
			<button
				onClick={props.onClick}
				className={cl(
					'flex items-center gap-4 rounded-[4px] p-4 w-22',
					'bg-neutral-200 hover:bg-neutral-300 transition-colors'
				)}>
				<div className={'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
					{!isAddress(props.address) ? (
						<IconAppAddressBook className={'size-4 text-neutral-600'} />
					) : (
						<AvatarWrapper
							isClickable={false}
							address={toAddress(props.address)}
							sizeClassname={'h-8 w-8 min-w-8'}
						/>
					)}
				</div>

				<IconChevron className={'size-4 min-w-4 text-neutral-600'} />
			</button>
		</div>
	);
}

/**************************************************************************************************
 ** Renders a button with a plus icon and "Add Contact" text. The button executes the provided
 ** onClick function and opens the curtain for adding contact to AB.
 *************************************************************************************************/
function AddButton({onClick}: {onClick: VoidFunction}): ReactElement {
	return (
		<button
			className={'flex w-fit flex-1 flex-col items-center rounded-[3px] bg-neutral-200 px-4 py-[14px]'}
			onClick={onClick}>
			<IconPlus className={'mb-1 size-4 text-neutral-600'} />
			<span className={'whitespace-nowrap text-[10px] text-neutral-600'}>{'Add Contact'}</span>
		</button>
	);
}

function SquareAddressAvatarButton(props: {address: TAddress; onClick: () => void}): ReactElement {
	return (
		<div className={'h-20 w-fit flex-1'}>
			<button
				onClick={props.onClick}
				className={cl(
					'z-20 relative border transition-all',
					'flex justify-center items-center cursor-pointer',
					'focus:placeholder:text-neutral-300 placeholder:transition-colors',
					'aspect-square bg-neutral-0 rounded-lg border-neutral-400 size-full',
					'hover:bg-neutral-100 transition-colors hover:border-neutral-600'
				)}>
				<div className={'flex size-10 items-center justify-center'}>
					{!isAddress(props.address) ? (
						<IconAppAddressBook className={'size-8 text-neutral-600'} />
					) : (
						<AvatarWrapper
							address={toAddress(props.address)}
							sizeClassname={'h-10 w-10 min-w-10'}
						/>
					)}
				</div>
			</button>
		</div>
	);
}

export function SmolAddressInput({
	onSetValue,
	value,
	isSimple = false,
	isSplitted = false,
	inputRef,
	...rest
}: TAddressInput): ReactElement {
	const inputWrapperRef = useRef<HTMLLabelElement>(null);
	const {onOpenCurtain} = useAddressBook();
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const {isCheckingValidity, validate} = useValidateAddressInput();
	const [{result}, actions] = useAsyncAbortable(validate, undefined);
	const {getCachedEntry, getEntry, dispatchConfiguration, setCurtainStatus} = useAddressBook();
	const [shouldAddToAddressBook, setShouldAddToAddressBook] = useState(false);
	const {configuration} = useSendContext();
	const chainID = useChainId();
	const config = useConfig();

	/**********************************************************************************************
	 ** Triggers an asynchronous operation to check if the receiver's address exists in the
	 ** address book and if it is a smart contract. It then updates the state to determine whether
	 ** the address should be added to the address book.
	 *********************************************************************************************/
	useAsyncTrigger(async () => {
		const fromAddressBook = await getEntry({address: configuration.receiver.address});
		const isSmartContract =
			!!configuration.receiver.address &&
			(await getIsSmartContract({
				address: configuration.receiver.address,
				chainId: chainID,
				config: config
			}));
		setShouldAddToAddressBook(isSmartContract);
		setShouldAddToAddressBook(
			Boolean((fromAddressBook?.isHidden || !fromAddressBook) && configuration.receiver.address)
		);
	}, [configuration.receiver.address, getEntry, chainID, config]);

	const validLabel = useMemo(() => {
		if (configuration.receiver.label.endsWith('.eth')) {
			return configuration.receiver.label.split('.').slice(0, -1).join(' ');
		}
		return configuration.receiver.label;
	}, [configuration.receiver.label]);

	/**********************************************************************************************
	 ** Returns a button component based on whether the address should be added to the AB.
	 ** If `shouldAddToAddressBook` is true, it returns the `AddButton` component. Otherwise,
	 ** it returns the `AddressAvatarButton` component.
	 *********************************************************************************************/
	const getButton = (onAddClick: VoidFunction): ReactElement => {
		if (shouldAddToAddressBook) {
			return <AddButton onClick={onAddClick} />;
		}

		return (
			<AddressAvatarButton
				onClick={() => onOpenCurtain(selectedEntry => onChange(selectedEntry.label))}
				address={toAddress(value.address)}
			/>
		);
	};

	/**********************************************************************************************
	 ** If user wants to add the TAddress we just put it in address input. If they use ens, we
	 ** go with relevant TAddress.
	 *********************************************************************************************/
	const getAddress = useCallback(
		(isSearchAnAddress: boolean, ensAddress: GetEnsAddressReturnType): TAddress | undefined => {
			if (isSearchAnAddress) {
				return toAddress(configuration?.receiver.address);
			}
			if (ensAddress) {
				return ensAddress;
			}
			return;
		},
		[configuration?.receiver.address]
	);

	/**********************************************************************************************
	 ** onAddContact is a function that opens AB curtain and sets entered address as entry.
	 *********************************************************************************************/
	const onAddContact = async (): Promise<void> => {
		const hasALabel = isZeroAddress(configuration.receiver.label);
		const isRecieverAnAddress = isAddress(configuration?.receiver.address);
		const lowerCaseRecieverValue = configuration?.receiver.address?.toLowerCase();
		const isEnsCandidate = lowerCaseRecieverValue?.endsWith('.eth');

		let ensAddress: GetEnsAddressReturnType = null;
		if (isEnsCandidate) {
			ensAddress = await getEnsAddress(config, {
				name: lowerCaseRecieverValue ?? '',
				chainId: mainnet.id
			});
		}

		dispatchConfiguration({
			type: 'SET_SELECTED_ENTRY',
			payload: {
				address: getAddress(isRecieverAnAddress, ensAddress),
				label: hasALabel ? validLabel : '',
				slugifiedLabel: '',
				chains: [],
				isFavorite: false
			}
		});
		setCurtainStatus({isOpen: true, isEditing: true});
	};

	/**********************************************************************************************
	 ** On mount, this component can have an autoPopulate value source, which means that we know
	 ** the address we want to use, but we want to delegate the input population (ens? clusters?
	 ** something else?) to this component so it can fetch the relevant information, verify the
	 ** address and display the result based on that.
	 ** This is a "hack" to trigger something which should only be trigger onChange otherwise.
	 *********************************************************************************************/
	useEffect(() => {
		if (value.address && value.source === 'autoPopulate') {
			actions.execute(value.address);
		}
	}, [actions, value.address, value.source]);

	/**********************************************************************************************
	 ** When clicking outside the input, we want to remove the focus state. However, as we are
	 ** using quite a lot of custom layout and wrapper to display all the elements we want to
	 ** display, we cannot simply use the onBlur event on the input element. Instead, we use the
	 ** useOnClickOutside hook to detect the click outside the input wrapper.
	 *********************************************************************************************/
	useOnClickOutside(inputWrapperRef as any, () => setIsFocused(false));

	const onChange = (input: string): void => {
		actions.abort();
		onSetValue({label: input});
		actions.execute(input);
	};

	const getInputValue = useCallback((): string | undefined => {
		if (isFocused) {
			return value.label;
		}

		if (isAddress(value.label)) {
			return truncateHex(value.label, 5);
		}

		const cachedEntry = getCachedEntry({address: value.address});
		if (cachedEntry && !cachedEntry.isHidden) {
			return cachedEntry.label;
		}

		return value.label;
	}, [getCachedEntry, isFocused, value.address, value.label]);

	const getBorderColor = useCallback((): string => {
		if (isFocused) {
			return 'border-neutral-600';
		}
		if (value.isValid === false) {
			return 'border-red';
		}
		return 'border-neutral-400';
	}, [isFocused, value.isValid]);

	useEffect(() => {
		if (!result) {
			return;
		}
		onSetValue(result);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [result]);

	const getHasStatusIcon = useCallback((): boolean => {
		if (!value.label) {
			return false;
		}
		if (!isFocused) {
			return false;
		}
		if (value.isValid === true || value.isValid === false || isCheckingValidity) {
			return true;
		}
		return false;
	}, [value.label, value.isValid, isFocused, isCheckingValidity]);

	const onFocusInput = useCallback(() => {
		if (!isFocused) {
			setIsFocused(true);
			setTimeout(() => {
				if (inputRef.current) {
					const end = value.label.length;
					inputRef.current.setSelectionRange(0, end);
					inputRef.current.scrollLeft = inputRef.current.scrollWidth;
					inputRef.current.focus();
				}
			}, 0);
		} else {
			setIsFocused(true);
		}
	}, [inputRef, isFocused, value.label.length]);

	return (
		<div className={cl(isSplitted ? 'flex flex-row gap-2 mt-1' : 'w-full')}>
			{isSplitted && (
				<SquareAddressAvatarButton
					address={toAddress(value.address)}
					onClick={() =>
						onOpenCurtain(selectedEntry => {
							actions.abort();
							onSetValue({label: selectedEntry.label, address: selectedEntry.address});
							actions.execute(selectedEntry.label);
						})
					}
				/>
			)}
			<div className={'group relative size-full rounded-[8px]'}>
				<label
					ref={inputWrapperRef}
					className={cl(
						'h-20 z-20 relative',
						'flex flex-row justify-between items-center cursor-text',
						'pr-2 pl-4 group bg-neutral-0 rounded-lg',
						'overflow-hidden border',
						getBorderColor()
					)}>
					<div className={'relative w-full py-2 pr-2 transition-all'}>
						<div
							className={cl(
								'absolute flex flex-row gap-2 items-center transition-all right-2 z-10',
								'pointer-events-none h-full pb-4'
							)}>
							{getHasStatusIcon() ? (
								<div className={'pointer-events-none relative size-4 min-w-[16px]'}>
									<IconCircleCheck
										className={`text-green absolute size-4 transition-opacity ${
											!isCheckingValidity && value.isValid === true ? 'opacity-100' : 'opacity-0'
										}`}
									/>
									<IconCircleCross
										className={`text-red absolute size-4 transition-opacity ${
											!isCheckingValidity && value.isValid === false ? 'opacity-100' : 'opacity-0'
										}`}
									/>
									<div className={'absolute inset-0 flex items-center justify-center'}>
										<IconLoader
											className={`size-4 animate-spin text-neutral-900 transition-opacity ${
												isCheckingValidity ? 'opacity-100' : 'opacity-0'
											}`}
										/>
									</div>
								</div>
							) : null}
						</div>
						<input
							ref={inputRef}
							className={cl(
								'w-full border-none bg-transparent p-0 text-xl transition-all pr-6',
								'text-neutral-900 placeholder:text-neutral-600 caret-neutral-700',
								'focus:placeholder:text-neutral-300 placeholder:transition-colors',
								!value.label ? 'translate-y-2' : 'translate-y-0',
								isFocused ? 'translate-y-2' : 'translate-y-0'
							)}
							type={'text'}
							placeholder={'0x...'}
							autoComplete={'off'}
							autoCorrect={'off'}
							spellCheck={'false'}
							value={getInputValue()}
							onChange={e => {
								onChange(e.target.value);
							}}
							onFocus={onFocusInput}
							// onBlur={() => setIsFocused(false)}
							{...rest}
						/>
						<TextTruncate
							tabIndex={-1}
							value={(isAddress(value?.address) && toAddress(value.address)) || value.error || ''}
							className={cl(
								isFocused ? 'opacity-0' : 'opacity-100',
								isFocused ? 'translate-y-8' : 'translate-y-0',
								isFocused ? 'pointer-events-none' : 'pointer-events-auto',
								value.error ? 'text-red' : 'text-neutral-600'
							)}
						/>
					</div>
					{!isSimple && getButton(onAddContact)}
				</label>
			</div>
		</div>
	);
}
