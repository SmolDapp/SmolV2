import {useCallback, useRef} from 'react';
import {usePlausible} from 'next-plausible';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {cl, isEthAddress} from '@builtbymom/web3/utils';
import {useMountEffect} from '@react-hookz/web';
import {useTokensWithBalance} from '@smolHooks/useTokensWithBalance';
import {SmolAddressInput} from '@lib/common/SmolAddressInput';
import {SmolTokenAmountInput} from '@lib/common/SmolTokenAmountInput';
import {IconAppMigrate} from '@lib/icons/IconApps';
import {IconCircleCheck} from '@lib/icons/IconCircleCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconCross} from '@lib/icons/IconCross';
import {IconSpinner} from '@lib/icons/IconSpinner';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';

import {SendStatus} from './SendStatus';
import {newSendVoidInput} from './useSend.helpers';
import {useSendContext} from './useSendContext';
import {useSendQueryManagement} from './useSendQuery';
import {SendWizard} from './Wizard';

import type {ReactElement} from 'react';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TInputAddressLike} from '@lib/utils/tools.address';

function SendTokenRow({input}: {input: TTokenAmountInputElement}): ReactElement {
	const {configuration, dispatchConfiguration} = useSendContext();

	const onSetValue = (value: Partial<TTokenAmountInputElement>): void => {
		dispatchConfiguration({type: 'SET_VALUE', payload: {...value, UUID: input.UUID}});
	};

	const onRemoveInput = (): void => {
		dispatchConfiguration({type: 'REMOVE_INPUT', payload: {UUID: input.UUID}});
	};

	const renderIcon = (): ReactElement | null => {
		if (input.status === 'pending') {
			return <IconSpinner className={'size-4'} />;
		}
		if (input.status === 'success') {
			return <IconCircleCheck className={'text-green size-4'} />;
		}
		if (input.status === 'error') {
			return <IconCircleCross className={'text-red size-4'} />;
		}
		return null;
	};

	const iconContainerStyle = 'absolute -right-10 top-1/2 -translate-y-1/2';

	return (
		<div className={'relative'}>
			<SmolTokenAmountInput
				onSetValue={onSetValue}
				value={input}
			/>
			{configuration.inputs.length > 1 && input.status === 'none' && (
				<button
					className={cl(
						iconContainerStyle,
						'-right-7 md:-right-11 p-1 text-neutral-600 transition-colors hover:text-neutral-700'
					)}
					onClick={onRemoveInput}>
					<IconCross className={'size-4'} />
				</button>
			)}

			<div className={iconContainerStyle}>{renderIcon()}</div>
		</div>
	);
}

export function Send(): ReactElement {
	const plausible = usePlausible();
	const {configuration, dispatchConfiguration} = useSendContext();
	const {hasInitialInputs} = useSendQueryManagement();
	const inputRef = useRef<HTMLInputElement>(null);
	const {currentNetworkTokenList} = useTokenList();
	const {listTokensWithBalance} = useTokensWithBalance();

	const isReceiverERC20 = Boolean(
		configuration.receiver.address && currentNetworkTokenList[configuration.receiver.address]
	);

	/**********************************************************************************************
	 ** This useCallback is used to add a new input to the configuration. It will dispatch the
	 ** ADD_INPUT action with the new input. The new input will be empty and will need to be
	 ** populated later.
	 *********************************************************************************************/
	const onAddToken = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.ADD_TOKEN_OPTION);
		dispatchConfiguration({type: 'ADD_INPUT', payload: undefined});
	}, [dispatchConfiguration, plausible]);

	/**********************************************************************************************
	 ** This useCallback is used to set the recipient address in the configuration. It will
	 ** dispatch the SET_RECEIVER action with the new value.
	 *********************************************************************************************/
	const onSetRecipient = useCallback(
		(value: Partial<TInputAddressLike>) => {
			dispatchConfiguration({type: 'SET_RECEIVER', payload: value});
		},
		[dispatchConfiguration]
	);

	/**********************************************************************************************
	 ** This effect is used to add an initial input when the component is mounted. If the
	 ** configuration.inputs is empty, it will add a new input. This is used to always have at
	 ** least one input in the configuration.inputs array.
	 *********************************************************************************************/
	useMountEffect(() => {
		if (!hasInitialInputs) {
			onAddToken();
		}
	});

	/**********************************************************************************************
	 ** onAddTokens will grad all the tokens from the listTokensWithBalance function and add them
	 ** to the configuration.inputs array. The ADD_INPUTS action will be dispatched with the new
	 ** inputs and remove all the empty inputs.
	 ** If we have a receiver already set, we will scroll to the send button.
	 *********************************************************************************************/
	const onAddAllTokens = useCallback((): void => {
		plausible(PLAUSIBLE_EVENTS.ADD_ALL_TOKENS_OPTIONS);
		const allTokens = listTokensWithBalance();
		const newInputs: TTokenAmountInputElement[] = [];

		for (const token of allTokens) {
			if (isEthAddress(token.address)) {
				continue;
			}
			const newItem = newSendVoidInput();
			newItem.token = token;
			newItem.amount = token.balance.display;
			newItem.normalizedBigAmount = token.balance;
			newItem.isValid = true;
			newInputs.push(newItem);
		}
		const ethValue = allTokens.find(token => isEthAddress(token.address));
		if (ethValue) {
			const newItem = newSendVoidInput();
			newItem.token = ethValue;
			newItem.amount = ethValue.balance.display;
			newItem.normalizedBigAmount = ethValue.balance;
			newItem.isValid = true;
			newInputs.push(newItem);
		}
		dispatchConfiguration({type: 'ADD_INPUTS', payload: newInputs});

		if (configuration.receiver.address) {
			setTimeout(() => {
				const element = document.getElementById('send-button');
				element?.scrollIntoView({behavior: 'smooth', block: 'start'});
			}, 100);
		}
	}, [configuration.receiver.address, dispatchConfiguration, listTokensWithBalance, plausible]);

	return (
		<div className={'max-w-108 w-full'}>
			<div className={'mb-4 flex flex-wrap gap-2 text-xs'}>
				<Button
					onClick={onAddAllTokens}
					className={'!h-8 py-1.5 !text-xs'}>
					<IconAppMigrate className={'mr-2 size-3 text-neutral-900'} />
					{'Migrate all'}
				</Button>
			</div>
			<div className={'mb-6'}>
				<p className={'mb-2 font-medium'}>{'Receiver'}</p>
				<SmolAddressInput
					inputRef={inputRef}
					onSetValue={onSetRecipient}
					value={configuration.receiver}
				/>
			</div>
			<div>
				<p className={'mb-2 font-medium'}>{'Token'}</p>
				{configuration.inputs.map(input => (
					<div
						className={'mb-4'}
						key={input.UUID}>
						<SendTokenRow input={input} />
					</div>
				))}
			</div>
			<div className={'mb-4'}>
				<button
					onClick={onAddToken}
					className={
						'rounded-lg bg-neutral-200 px-5 py-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-300'
					}>
					{'+ Add token'}
				</button>
			</div>
			<SendStatus isReceiverERC20={isReceiverERC20} />
			<SendWizard isReceiverERC20={isReceiverERC20} />
		</div>
	);
}
