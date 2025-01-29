'use client';

import {IconChevronBoth} from '@lib/icons/IconChevronBoth';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';
import {IconCircleCheck} from '@lib/icons/IconCircleCheck';
import {IconCircleCross} from '@lib/icons/IconCircleCross';
import {IconGears} from '@lib/icons/IconGears';
import {IconSpinner} from '@lib/icons/IconSpinner';
import {cl} from '@lib/utils/helpers';
import {NoNaN, formatAmount, formatCounterValue} from '@lib/utils/numbers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {CHAINS} from '@lib/utils/tools.chains.ts';
import {useDeepCompareEffect} from '@react-hookz/web';
import {isZeroAddress} from 'lib/utils/tools.addresses';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import InputNumber from 'rc-input-number';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useChainId, useSwitchChain} from 'wagmi';

import {usePrices} from '@smolContexts/WithPrices/WithPrices';
import {formatSeconds} from '@smolHooks/useTimer';
import {useValidateAmountInput} from '@smolHooks/web3/useValidateAmountInput';
import {NetworkInputSelector} from 'packages/smol/common/NetworkSelector/Input';
import {SmolAddressInput} from 'packages/smol/common/SmolAddressInput';
import {SmolTokenAmountInput} from 'packages/smol/common/SmolTokenAmountInput';
import {SmolTokenSelectorButton} from 'packages/smol/common/SmolTokenSelectorButton';
import {TextTruncate} from 'packages/smol/common/TextTruncate';

import {SwapStatus} from './components/SwapStatus';
import {SendWizard} from './components/Wizard';
import {useSwapFlow} from './contexts/useSwapFlow.lifi';

import type {TNormalizedBN} from '@lib/utils/numbers';
import type {TInputAddressLike} from '@lib/utils/tools.addresses';
import type {TTokenAmountInputElement} from 'packages/smol/common/SmolTokenAmountInput';
import type {ReactElement, RefObject} from 'react';

function ReadonlySwapTokenRow(props: {
	value: TTokenAmountInputElement;
	isFetchingQuote: boolean;
	onChangeValue: (value: Partial<TTokenAmountInputElement>) => void;
	chainIDToUse?: number;
}): ReactElement {
	const chainID = useChainId();
	const {result, validate} = useValidateAmountInput();
	const {getPrice, pricingHash} = usePrices();
	const [price, setPrice] = useState<TNormalizedBN | undefined>(undefined);
	const selectedToken = props.value.token;

	/**********************************************************************************************
	 ** This useDeepCompareEffect hook will be triggered when the selectedToken, chainID or
	 ** pricingHash changes, indicating that we need to update the price for the current token.
	 ** It will ask the usePrices context to retrieve the prices for the tokens (from cache), or
	 ** fetch them from an external endpoint (depending on the price availability).
	 *********************************************************************************************/
	useEffect(() => {
		if (!selectedToken) {
			return;
		}
		setPrice(getPrice(selectedToken));
	}, [selectedToken, chainID, pricingHash, getPrice]);

	/**********************************************************************************************
	 ** This useDeepCompareEffect hook will be triggered when the result changes, indicating that
	 ** we need to update the value of the token amount input. If the result is not null, then the
	 ** onChangeValue function is called with the result value.
	 *********************************************************************************************/
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
						'z-20 relative border transition-all h-20',
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
								'placeholder:transition-colors overflow-hidden',
								props.isFetchingQuote
									? 'animate-pulse placeholder:text-neutral-600 text-neutral-600'
									: ''
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
										: price
											? formatCounterValue(
													props.value.normalizedBigAmount.normalized,
													price.normalized
												)
											: 'N/A'}
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
							shouldUseCurtainWithTabs
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
			return <IconCircleCheck className={'text-green size-4'} />;
		}
		if (props.input.status === 'error') {
			return <IconCircleCross className={'text-red size-4'} />;
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
	const plausible = usePlausible();
	const chainID = useChainId();
	const {switchChainAsync} = useSwitchChain();
	const {isFetchingQuote, openSettingsCurtain, estimatedTime, ...ctx} = useSwapFlow();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [shouldUseCustomRecipient, setShouldUseCustomRecipient] = useState(false);
	const [fromNetwork, setFromNetwork] = useState(NoNaN(Number(searchParams?.get('chainFrom') || -1)));
	const [toNetwork, setToNetwork] = useState(NoNaN(Number(searchParams?.get('chainTo') || -1)));
	const createQueryString = useCallback(
		(args: Record<string, string | undefined>) => {
			const params = new URLSearchParams(searchParams?.toString());
			Object.entries(args).forEach(([key, value]) => {
				if (value === undefined) {
					params.delete(key);
				} else {
					params.set(key, value);
				}
			});
			return params.toString();
		},
		[searchParams]
	);
	const {inverseTokens, setReceiver, resetInput, resetOutput, setInput, setOutput} = ctx;
	const {receiver, input, output} = ctx;

	/**********************************************************************************************
	 ** This useEffect is used to set the fromNetwork and toNetwork values based on the
	 ** input and output tokens. If the fromNetwork or toNetwork is set to -1, then the value is
	 ** set to the chainID. If the input or output token chainID is set, then the value is set to
	 ** the input or output token chainID.
	 *********************************************************************************************/
	useEffect(() => {
		if (fromNetwork === -1) {
			setFromNetwork(input.token?.chainID || chainID);
			router.push(pathname + '?' + createQueryString({chainFrom: input.token?.chainID?.toString()}));
		}

		if (toNetwork === -1) {
			setToNetwork(output.token?.chainID || chainID);
			router.push(pathname + '?' + createQueryString({chainTo: output.token?.chainID?.toString()}));
		}
	}, [
		chainID,
		fromNetwork,
		toNetwork,
		pathname,
		searchParams,
		router,
		createQueryString,
		input.token?.chainID,
		output.token?.chainID
	]);

	/**********************************************************************************************
	 ** The swapTokens function is used to swap the fromNetwork and toNetwork values.
	 *********************************************************************************************/
	const swapTokens = useCallback(() => {
		plausible(PLAUSIBLE_EVENTS.SWAP_INVERSE_IN_OUT);
		inverseTokens();
		setFromNetwork(toNetwork);
		setToNetwork(fromNetwork);
		router.push(
			pathname +
				'?' +
				createQueryString({
					chainFrom: output.token?.chainID?.toString(),
					chainTo: input.token?.chainID?.toString(),
					tokenFrom: output.token?.address,
					tokenTo: input.token?.address
				})
		);
	}, [
		plausible,
		inverseTokens,
		toNetwork,
		fromNetwork,
		router,
		pathname,
		createQueryString,
		output.token?.chainID,
		output.token?.address,
		input.token?.chainID,
		input.token?.address
	]);

	/**********************************************************************************************
	 ** The onSetRecipient function is used to set the recipient address for the swap.
	 *********************************************************************************************/
	const onSetRecipient = (value: Partial<TInputAddressLike>): void => {
		if (!isZeroAddress(value.address)) {
			plausible(PLAUSIBLE_EVENTS.SWAP_SET_RECIPIENT);
		}
		setReceiver(value as TInputAddressLike);
		router.push(pathname + '?' + createQueryString({receiver: value.address}));
	};

	/**********************************************************************************************
	 ** The swapSupportedNetworks constant is used to filter the supported networks from the
	 ** CHAINS object. It filters the supported networks based on the isSupported
	 ** property.
	 *********************************************************************************************/
	const swapSupportedNetworks = useMemo(() => {
		const allSupportedNetworks = Object.values(CHAINS).filter(network => network.isLifiSwapSupported);
		return allSupportedNetworks;
	}, []);

	return (
		<div className={'w-full max-w-screen-sm'}>
			<div>
				<div className={'flex items-end justify-between'}>
					<p className={'font-medium'}>{'Your crosschain swap'}</p>
					<button
						className={
							'hover:bg-primaryHover group rounded-lg bg-neutral-300 p-2 text-neutral-600 transition-all hover:scale-110'
						}
						onClick={openSettingsCurtain}>
						<IconGears className={'size-4 transition-colors group-hover:text-white'} />
					</button>
				</div>

				<div className={'mb-1 mt-2 w-full items-center rounded-xl bg-neutral-200 p-6 pr-10 md:w-auto'}>
					<div className={cl('flex flex-row gap-2')}>
						<div className={'w-20'}>
							<NetworkInputSelector
								value={fromNetwork}
								networks={swapSupportedNetworks}
								onChange={value => {
									plausible(PLAUSIBLE_EVENTS.SWAP_SET_FROM_NETWORK, {props: {toChainID: value}});
									setFromNetwork(value);
									router.push(pathname + '?' + createQueryString({chainFrom: value.toString()}));
									resetInput();
									switchChainAsync({chainId: value});
								}}
							/>
						</div>

						<div className={'w-full'}>
							<SwapTokenRow
								input={input}
								chainIDToUse={fromNetwork}
								onChangeValue={value => {
									setInput({
										...value,
										UUID: input.UUID
									} as TTokenAmountInputElement);
									router.push(
										`${pathname}?${createQueryString({
											chainFrom: value.token?.chainID?.toString(),
											tokenFrom: value.token?.address
										})}`
									);
								}}
							/>
						</div>
					</div>

					<div className={'my-4 flex w-full items-end justify-center'}>
						<button
							onClick={swapTokens}
							className={
								'bg-neutral-0 hover:bg-primaryHover group rounded-lg border border-neutral-400 p-2 text-neutral-600 transition-all hover:scale-110'
							}>
							<IconChevronBoth className={'size-6 transition-colors group-hover:text-white'} />
						</button>
					</div>

					<div className={cl('flex flex-row gap-2')}>
						<div className={'w-20'}>
							<NetworkInputSelector
								value={toNetwork}
								networks={swapSupportedNetworks}
								onChange={value => {
									plausible(PLAUSIBLE_EVENTS.SWAP_SET_TO_NETWORK, {props: {toChainID: value}});
									setToNetwork(value);
									router.push(pathname + '?' + createQueryString({chainTo: value.toString()}));
									resetOutput();
								}}
							/>
						</div>
						<div className={'w-full'}>
							<ReadonlySwapTokenRow
								value={output}
								isFetchingQuote={isFetchingQuote}
								chainIDToUse={toNetwork}
								onChangeValue={value => {
									setOutput({
										...value,
										UUID: output.UUID
									} as TTokenAmountInputElement);

									router.push(
										`${pathname}?${createQueryString({
											chainTo: value.token?.chainID?.toString(),
											tokenTo: value.token?.address
										})}`
									);
								}}
							/>
						</div>
					</div>
				</div>

				<div className={'flex w-full justify-between pl-1 pt-2'}>
					<button
						onClick={() => setShouldUseCustomRecipient(prev => !prev)}
						className={'flex cursor-pointer items-center justify-center text-sm text-neutral-600'}>
						<p className={'pr-1'}>{'Send to a different address'}</p>
						<IconChevronBottom
							className={cl(
								'size-3.5 transition-all duration-100',
								shouldUseCustomRecipient ? '-rotate-0' : '-rotate-90'
							)}
						/>
					</button>
					<p className={cl('text-center text-xs text-neutral-600', estimatedTime ? 'block' : 'hidden')}>
						{'Swap estimated time: '}
						<span className={'text-neutral-900/70'}>
							{estimatedTime ? formatSeconds(estimatedTime) : ''}
						</span>
					</p>
				</div>
				<div
					className={cl(
						'my-1 w-full items-center rounded-xl bg-neutral-200 p-6 pr-10 md:w-auto',
						shouldUseCustomRecipient ? 'block' : 'hidden'
					)}>
					<div className={cl('flex flex-row gap-2 mt-1')}>
						<div className={'w-full'}>
							<SmolAddressInput
								inputRef={inputRef as RefObject<HTMLInputElement>}
								isSimple
								isSplitted
								onSetValue={onSetRecipient}
								value={receiver}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className={'mt-2'}>
				<SwapStatus destinationChainID={toNetwork} />

				<SendWizard />
			</div>
		</div>
	);
}
