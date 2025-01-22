'use client';

import {cl} from '@lib/utils/helpers';
import {useMountEffect} from '@react-hookz/web';
import {useCallback, useState} from 'react';

import {useAddressBook} from '@smolContexts/useAddressBook';
import {useValidateNameInput} from '@smolHooks/web3/useValidateNameInput';
import {TextTruncate} from 'packages/smol/common/TextTruncate';

import type {InputHTMLAttributes, ReactElement, RefObject} from 'react';

type TSmolNameInputProps = {
	setIsValid?: (value: boolean | 'undetermined') => void;
	inputRef: RefObject<HTMLInputElement>;
	disabled: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

export const SmolNameInput = ({setIsValid, ...rest}: TSmolNameInputProps): ReactElement => {
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isTouched, setIsTouched] = useState<boolean>(false);
	const [inputName, setInputName] = useState<string>('');

	const {dispatchConfiguration: dispatch, selectedEntry} = useAddressBook();
	const {validate} = useValidateNameInput();
	const validation = validate(inputName, isTouched, setIsValid);

	/**********************************************************************************************
	 ** If we already have some label in "selectedEntry", we want to use it first. And then we let
	 ** the user to change it by themselves
	 *********************************************************************************************/
	useMountEffect(() => {
		selectedEntry?.label && setInputName(selectedEntry.label);
	});

	const getBorderColor = useCallback((): string => {
		if (isFocused) {
			return 'border-neutral-600';
		}
		if (validation) {
			return 'border-red';
		}
		return 'border-neutral-400';
	}, [isFocused, validation]);

	return (
		<div>
			<label
				className={cl(
					getBorderColor(),
					'h-20 z-20',
					'flex flex-row justify-between items-center cursor-text',
					'p-2 pl-4 group bg-neutral-0 rounded-lg',
					'overflow-hidden border',
					'flex flex-col justify-center h-full'
				)}>
				<input
					value={inputName}
					type={'text'}
					minLength={1}
					maxLength={22}
					placeholder={'Mom'}
					pattern={'^(?!0x).*'}
					autoComplete={'off'}
					autoCorrect={'off'}
					spellCheck={'false'}
					onFocus={() => {
						setIsFocused(true);
						setIsTouched(true);
					}}
					onBlur={() => {
						dispatch({type: 'SET_LABEL', payload: inputName});
						setIsFocused(false);
					}}
					onChange={e => setInputName(e.target.value)}
					className={cl(
						'w-full border-none bg-transparent p-0 text-xl transition-all pr-6',
						'text-neutral-900 placeholder:text-neutral-600 caret-neutral-700',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors'
					)}
					{...rest}
				/>
				{validation && !isFocused && (
					<TextTruncate
						value={validation ?? ''}
						className={cl(
							isFocused ? 'opacity-0' : 'opacity-100',
							isFocused ? 'translate-y-8' : 'translate-y-0',
							isFocused ? 'pointer-events-none' : 'pointer-events-auto',
							validation ? 'text-red' : 'text-neutral-600'
						)}
					/>
				)}
			</label>
		</div>
	);
};
