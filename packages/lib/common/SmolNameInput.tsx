import {type InputHTMLAttributes, type ReactElement, type RefObject, useCallback, useState} from 'react';
import {cl} from '@builtbymom/web3/utils';
import {TextTruncate} from '@lib/common/TextTruncate';
import {useValidateNameInput} from '@lib/hooks/useValidateNameInput';

type TSmolNameInputProps = {
	onSetValue: (value: string) => void;
	value: string;
	set_isValid?: (value: boolean | 'undetermined') => void;
	inputRef: RefObject<HTMLInputElement>;
	disabled: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>;

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
