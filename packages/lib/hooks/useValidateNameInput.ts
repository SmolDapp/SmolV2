export function useValidateNameInput(): {
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
