import {useRef} from 'react';

import {SmolAddressInput} from '@lib/common/SmolAddressInput';
import {SmolAmountInput} from '@lib/common/SmolAmountInput';
import {IconCross} from '@lib/icons/IconCross';
import {useDisperse} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse';

import type {TAmountInputElement} from '@lib/common/SmolAmountInput';
import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TDisperseInput} from 'packages/smol/app/(apps)/disperse/types';
import type {ReactElement, RefObject} from 'react';

type TDisperseAddressAndAmountInputs = {
	input: TDisperseInput;
	price: TNormalizedBN | undefined;
};

export function DisperseAddressAndAmountInputs({input, price}: TDisperseAddressAndAmountInputs): ReactElement {
	const {configuration, dispatchConfiguration} = useDisperse();
	const inputRef = useRef<HTMLInputElement>(null);

	const onSetReceiver = (value: Partial<TInputAddressLike>): void => {
		dispatchConfiguration({type: 'SET_RECEIVER', payload: {...value, UUID: input.UUID}});
	};

	const onSetAmount = (value: Partial<TAmountInputElement>): void => {
		dispatchConfiguration({type: 'SET_VALUE', payload: {...value, UUID: input.UUID}});
	};

	const onRemoveInput = (): void => {
		dispatchConfiguration({type: 'DEL_RECEIVER_BY_UUID', payload: input.UUID});
	};

	return (
		<div className={'mb-4 flex w-full items-center rounded-md bg-neutral-200 py-2 pl-2 md:w-auto'}>
			<div className={'flex w-full flex-col gap-4 md:flex-row'}>
				<div className={'flex w-full max-w-full md:max-w-[424px]'}>
					<SmolAddressInput
						inputRef={inputRef as RefObject<HTMLInputElement>}
						onSetValue={onSetReceiver}
						value={input.receiver}
					/>
				</div>
				<div>
					<SmolAmountInput
						onSetValue={onSetAmount}
						value={input.value}
						token={configuration.tokenToSend}
						price={price}
					/>
				</div>
			</div>
			<button
				className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}
				onClick={onRemoveInput}>
				<IconCross className={'size-4'} />
			</button>
		</div>
	);
}
