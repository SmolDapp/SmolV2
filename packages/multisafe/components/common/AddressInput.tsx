import React, {useCallback, useMemo, useRef, useState} from 'react';
import {cl, isZeroAddress, toAddress, ZERO_ADDRESS} from '@builtbymom/web3/utils';
import {IconCircleCheck} from '@lib/icons/IconCircleCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconLoader} from '@lib/icons/IconLoader';
import {checkENSValidity} from '@lib/utils/tools.ens';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

export type TAddressInput = {
	value: TInputAddressLike;
	onChangeValue: (value: TInputAddressLike) => void;
	inputClassName?: string;
};
export type TInputAddressLike = {
	address: TAddress | undefined;
	label: string;
	isValid: boolean | 'undetermined';
};
export const defaultInputAddressLike: TInputAddressLike = {
	address: undefined,
	label: '',
	isValid: false
};

function AddressInput({value, onChangeValue, ...props}: TAddressInput): ReactElement {
	const [isLoadingValidish, set_isLoadingValidish] = useState<boolean>(false);
	const currentLabel = useRef<string>(value.label);
	const isFocused = useRef<boolean>(false);
	const status = useMemo((): 'valid' | 'invalid' | 'warning' | 'pending' | 'none' => {
		if (value.isValid === true) {
			return 'valid';
		}
		if (value.isValid === false && value.label !== '' && value.address === ZERO_ADDRESS) {
			return 'invalid';
		}
		if (value.isValid === false && value.label !== '' && !isLoadingValidish && !isFocused.current) {
			return 'invalid';
		}
		if (isLoadingValidish) {
			return 'pending';
		}
		return 'none';
	}, [value, isLoadingValidish, isFocused]);

	const onChange = useCallback(
		async (label: string): Promise<void> => {
			currentLabel.current = label;

			if (label.endsWith('.eth') && label.length > 4) {
				onChangeValue({address: undefined, label, isValid: 'undetermined'});
				set_isLoadingValidish(true);
				const [address, isValid] = await checkENSValidity(label);
				if (currentLabel.current === label) {
					onChangeValue({address, label, isValid});
				}
				set_isLoadingValidish(false);
			} else if (!isZeroAddress(toAddress(label))) {
				onChangeValue({address: toAddress(label), label, isValid: true});
			} else {
				onChangeValue({address: undefined, label, isValid: false});
			}
		},
		[onChangeValue, currentLabel]
	);

	return (
		<div className={'smol--input-wrapper'}>
			<input
				aria-invalid={status === 'invalid'}
				autoFocus
				onFocus={async (): Promise<void> => {
					isFocused.current = true;
					onChange(value.label);
				}}
				onBlur={(): void => {
					isFocused.current = false;
				}}
				onChange={async (e): Promise<void> => onChange(e.target.value)}
				required
				autoComplete={'off'}
				spellCheck={false}
				placeholder={'0x...'}
				type={'text'}
				value={value.label}
				className={cl(props.inputClassName, 'smol--input font-mono font-bold')}
			/>
			<label
				className={
					status === 'invalid' || status === 'warning' ? 'relative' : 'pointer-events-none relative size-4'
				}>
				<span className={status === 'invalid' || status === 'warning' ? 'tooltip' : 'pointer-events-none'}>
					<div className={'pointer-events-none relative size-4'}>
						<IconCircleCheck
							className={`absolute size-4 text-[#16a34a] transition-opacity ${
								status === 'valid' ? 'opacity-100' : 'opacity-0'
							}`}
						/>
						<IconCircleCross
							className={`absolute size-4 text-[#e11d48] transition-opacity ${
								status === 'invalid' ? 'opacity-100' : 'opacity-0'
							}`}
						/>
						<div className={'absolute inset-0 flex items-center justify-center'}>
							<IconLoader
								className={`size-4 animate-spin text-neutral-900 transition-opacity ${
									status === 'pending' ? 'opacity-100' : 'opacity-0'
								}`}
							/>
						</div>
					</div>
					<span className={'tooltiptextsmall'}>
						{status === 'invalid' && 'This address is invalid'}
						{status === 'warning' && 'This address is already in use'}
					</span>
				</span>
			</label>
		</div>
	);
}

export default AddressInput;
