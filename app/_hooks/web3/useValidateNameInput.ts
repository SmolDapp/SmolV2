export function useValidateNameInput(): {
	validate: (
		input: string,
		isTouched?: boolean,
		setIsValid?: (value: boolean | 'undetermined') => void
	) => string | null;
} {
	const validate = (
		input: string,
		isTouched?: boolean,
		setIsValid?: (value: boolean | 'undetermined') => void
	): string | null => {
		if (input.startsWith('0x')) {
			setIsValid?.(false);
			return 'The name cannot start with `0x`';
		}
		if (input.length > 22) {
			setIsValid?.(false);
			return 'The name cannot be longer than 22 characters';
		}
		if (input.includes('.')) {
			setIsValid?.(false);
			return 'The name must not contain `.`';
		}
		if (isTouched && input.length < 1) {
			setIsValid?.(false);
			return 'The name cannot be empty';
		}

		if (input.length < 1) {
			setIsValid?.('undetermined');
			return null;
		}
		setIsValid?.(true);
		return null;
	};

	return {validate};
}
