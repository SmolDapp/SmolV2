import {type InputHTMLAttributes, type ReactElement, type RefObject, useCallback, useState} from 'react';
import {TextTruncate} from 'lib/common';
import {cl} from '@builtbymom/web3/utils';

type TSmolNameInputProps = {
	onSetValue: (value: string) => void;
	value: string;
	set_isValid?: (value: boolean | 'undetermined') => void;
	inputRef: RefObject<HTMLInputElement>;
	disabled: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

function useValidateNameInput(): {
	validate: (
		input: string,
		isTouched?: boolean,
		set_isValid?: (value: boolean | 'undetermined') => void
	) => string | null;
} {
	const validate = (
		input: string,
		isTouched?: boolean,
		set_isValid?: (value: boolean | 'undetermined') => void
	): string | null => {
		if (input.startsWith('0x')) {
			set_isValid?.(false);
			return 'The name cannot start with `0x`';
		}
		if (input.length > 22) {
			set_isValid?.(false);
			return 'The name cannot be longer than 22 characters';
		}
		if (input.includes('.')) {
			set_isValid?.(false);
			return 'The name must not contain `.`';
		}
		if (isTouched && input.length < 1) {
			set_isValid?.(false);
			return 'The name cannot be empty';
		}

		if (input.length < 1) {
			set_isValid?.('undetermined');
			return null;
		}
		set_isValid?.(true);
		return null;
	};

	return {validate};
}

export const SmolNameInput = ({onSetValue, value, set_isValid, ...rest}: TSmolNameInputProps): ReactElement => {
	const [isFocused, set_isFocused] = useState<boolean>(false);
	const [isTouched, set_isTouched] = useState<boolean>(false);
	const onChangeValue = (value: string): void => {
		onSetValue(value);
	};

	const {validate} = useValidateNameInput();

	const validation = validate(value, isTouched, set_isValid);

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
					value={value}
					type={'text'}
					minLength={1}
					maxLength={22}
					placeholder={'Mom'}
					pattern={'^(?!0x).*'}
					autoComplete={'off'}
					autoCorrect={'off'}
					spellCheck={'false'}
					onFocus={() => {
						set_isFocused(true);
						set_isTouched(true);
					}}
					onBlur={() => set_isFocused(false)}
					onChange={e => onChangeValue(e.target.value)}
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
