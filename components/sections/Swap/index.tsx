import {type ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {NetworkInputSelector} from 'components/designSystem/NetworkSelector/Input';
import {SmolAddressInput} from 'components/designSystem/SmolAddressInput';
import {SmolTokenAmountInput, useValidateAmountInput} from 'components/designSystem/SmolTokenAmountInput';
import {SmolTokenSelectorButton} from 'components/designSystem/SmolTokenSelectorButton';
import InputNumber from 'rc-input-number';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, formatAmount, formatCounterValue} from '@builtbymom/web3/utils';
import {IconChevronBoth} from '@icons/IconChevronBoth';
import {IconCircleCheck} from '@icons/IconCircleCheck';
import {IconCircleCross} from '@icons/IconCircleCross';
import {IconGears} from '@icons/IconGears';
import {IconSpinner} from '@icons/IconSpinner';
import {useDeepCompareEffect} from '@react-hookz/web';
import {TextTruncate} from '@common/TextTruncate';

import {SwapStatus} from './SwapStatus';
import {useSwapFlow} from './useSwapFlow.lifi';
import {SendWizard} from './Wizard';

import type {TTokenAmountInputElement} from 'components/designSystem/SmolTokenAmountInput';
import type {TInputAddressLike} from '@utils/tools.address';

function FakeOutputTokenRow(props: {
	value: TTokenAmountInputElement;
	isFetchingQuote: boolean;
	onChangeValue: (value: Partial<TTokenAmountInputElement>) => void;
	chainIDToUse?: number;
}): ReactElement {
	const {safeChainID} = useChainID();
	const {result, validate} = useValidateAmountInput();
	const selectedToken = props.value.token;
	const {data: prices} = usePrices({
		tokens: selectedToken ? [selectedToken] : [],
		chainId: selectedToken?.chainID || safeChainID
	});
	const price = prices && selectedToken ? prices[selectedToken.address] : undefined;

	useDeepCompareEffect(() => {
		if (!result) {
			return;
		}
		props.onChangeValue(result);
	}, [result]);

	return (
		<div className={'relative'}>
			<div className={'relative size-full rounded-lg'}>
				<label
					className={cl(
						'z-20 relative border transition-all',
						'flex flex-grow-0 items-center cursor-text',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors',
						'p-2 pl-4 group bg-neutral-0 rounded-lg border-neutral-400'
					)}>
					<div className={'relative w-full pr-2'}>
						<InputNumber
							disabled
							prefixCls={cl(
								'w-full border-none bg-transparent p-0 text-xl transition-all',
								'text-neutral-900 placeholder:text-neutral-400 focus:placeholder:text-neutral-400/30',
								'placeholder:transition-colors overflow-hidden'
							)}
							placeholder={'0.00'}
							value={props.value.amount}
							decimalSeparator={'.'}
							min={'0'}
							step={0.1}
						/>
						<div className={'flex items-center justify-between text-xs text-[#ADB1BD]'}>
							{props.value.value || props.value.normalizedBigAmount.normalized ? (
								<p>
									{props.value.value
										? `$${formatAmount(props.value.value, 2)}`
										: formatCounterValue(
												props.value.normalizedBigAmount.normalized,
												price?.normalized ?? 0
											)}
								</p>
							) : (
								<TextTruncate value={'N/A'} />
							)}
						</div>
					</div>
					<div className={'w-full max-w-[176px]'}>
						<SmolTokenSelectorButton
							onSelectToken={token => validate(props.value.amount, token)}
							token={props.value.token}
							chainID={props.chainIDToUse}
						/>
					</div>
				</label>
			</div>
			<div className={'absolute -right-6 top-1/2 -translate-y-1/2'}>
				{props.isFetchingQuote ? <IconSpinner className={'size-4'} /> : null}
			</div>
		</div>
	);
}

function SwapTokenRow(props: {
	input: TTokenAmountInputElement;
	onChangeValue: (value: Partial<TTokenAmountInputElement>) => void;
	chainIDToUse?: number;
}): ReactElement {
	const renderIcon = (): ReactElement | null => {
		if (props.input.status === 'pending') {
			return <IconSpinner className={'size-4'} />;
		}
		if (props.input.status === 'success') {
			return <IconCircleCheck className={'size-4 text-green'} />;
		}
		if (props.input.status === 'error') {
			return <IconCircleCross className={'size-4 text-red'} />;
		}
		return null;
	};

	return (
		<div className={'relative'}>
			<SmolTokenAmountInput
				onSetValue={props.onChangeValue}
				value={props.input}
				chainIDToUse={props.chainIDToUse}
			/>
			<div className={'absolute -right-10 top-1/2 -translate-y-1/2'}>{renderIcon()}</div>
		</div>
	);
}

export function Swap(): ReactElement {
	const {chainID} = useWeb3();
	const {isFetchingQuote, configuration, dispatchConfiguration} = useSwapFlow();
	const inputRef = useRef<HTMLInputElement>(null);
	const [shouldUseCustomRecipient, set_shouldUseCustomRecipient] = useState(false);
	const [fromNetwork, set_fromNetwork] = useState(-1);
	const [toNetwork, set_toNetwork] = useState(-1);

	useEffect(() => {
		if (fromNetwork === -1) {
			set_fromNetwork(chainID);
		} else if (configuration.input.token?.chainID) {
			set_fromNetwork(configuration.input.token.chainID);
		}
		if (toNetwork === -1) {
			set_toNetwork(chainID);
		} else if (configuration.output.token?.chainID) {
			set_toNetwork(configuration.output.token.chainID);
		}
	}, [chainID, fromNetwork, toNetwork, configuration]);

	const swapChains = useCallback(() => {
		dispatchConfiguration({type: 'INVERSE_TOKENS', payload: undefined});
		set_fromNetwork(toNetwork);
		set_toNetwork(fromNetwork);
	}, [dispatchConfiguration, fromNetwork, toNetwork]);

	const onSetRecipient = (value: Partial<TInputAddressLike>): void => {
		dispatchConfiguration({type: 'SET_RECEIVER', payload: value});
	};

	return (
		<div className={'w-full max-w-screen-sm'}>
			<div>
				<p className={'font-medium'}>{'Your swap'}</p>
				<div className={'mb-4 mt-1 w-full items-center rounded-xl bg-neutral-200 p-6 pr-10 md:w-auto'}>
					<div className={cl('flex flex-row gap-2')}>
						<div>
							<NetworkInputSelector
								value={fromNetwork}
								onChange={value => {
									set_fromNetwork(value);
									dispatchConfiguration({type: 'RESET_INPUT', payload: undefined});
								}}
							/>
						</div>

						<div className={'w-full'}>
							<SwapTokenRow
								input={configuration.input}
								chainIDToUse={fromNetwork}
								onChangeValue={value => {
									dispatchConfiguration({
										type: 'SET_INPUT_VALUE',
										payload: {...value, UUID: configuration.input.UUID}
									});
								}}
							/>
						</div>
					</div>

					<div className={'my-4 flex w-full items-end justify-center'}>
						<button
							onClick={swapChains}
							className={
								'group rounded-lg border border-neutral-400 bg-neutral-0 p-2 text-neutral-600 transition-all hover:scale-110 hover:bg-primaryHover'
							}>
							<IconChevronBoth className={'size-6 transition-colors group-hover:text-white'} />
						</button>
					</div>

					<div className={cl('flex flex-row gap-2')}>
						<div>
							<NetworkInputSelector
								value={toNetwork}
								onChange={value => {
									set_toNetwork(value);
									dispatchConfiguration({type: 'RESET_OUTPUT', payload: undefined});
								}}
							/>
						</div>
						<div className={'w-full'}>
							<FakeOutputTokenRow
								value={configuration.output}
								isFetchingQuote={isFetchingQuote}
								chainIDToUse={toNetwork}
								onChangeValue={value => {
									dispatchConfiguration({
										type: 'SET_OUTPUT_VALUE',
										payload: {...value, UUID: configuration.output.UUID}
									});
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<SwapStatus />

			<SendWizard>
				<button
					className={
						'group rounded-lg bg-neutral-300 p-2 text-neutral-600 transition-all hover:scale-110 hover:bg-primaryHover'
					}
					onClick={() => set_shouldUseCustomRecipient(prev => !prev)}>
					<IconGears className={'size-4 transition-colors group-hover:text-white'} />
				</button>
			</SendWizard>

			{shouldUseCustomRecipient ? (
				<div className={'mt-6 w-full items-center rounded-xl bg-neutral-200 p-4 md:w-auto'}>
					<div className={''}>
						<p className={'font-medium'}>{'Send to'}</p>
						<div className={'mb-4 mt-1'}>
							<SmolAddressInput
								inputRef={inputRef}
								onSetValue={onSetRecipient}
								value={configuration.receiver}
							/>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
