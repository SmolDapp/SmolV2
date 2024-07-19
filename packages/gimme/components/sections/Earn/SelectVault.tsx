import {Fragment, type ReactElement, useCallback, useMemo, useState} from 'react';
import {IconCross} from 'packages/lib/icons/IconCross';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatPercent, numberSort, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';
import * as Popover from '@radix-ui/react-popover';
import {usePrices} from '@lib/contexts/usePrices';
import IconChevronPlain from '@lib/icons/IconChevronPlain';
import {createMarkup} from '@lib/utils/react/createMarkup';

import {useEarnFlow} from './useEarnFlow';
import {Vault} from './Vault';

import type {TSortDirection} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

function VaultInfo({
	vaultInfo,
	version,
	onClose
}: {
	vaultInfo: TYDaemonVault | undefined;
	version: 'sm' | 'md' | 'xl';
	onClose: VoidFunction;
}): ReactElement {
	return (
		<Popover.Content
			avoidCollisions={false}
			side={version === 'sm' ? 'top' : version === 'md' ? 'right' : 'right'}
			align={'start'}
			sideOffset={16}
			className={cl(
				'z-[100]',
				'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
				'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
				'data-[side=bottom]:slide-in-from-top-2',
				version === 'sm' ? 'flex md:hidden xl:hidden' : '',
				version === 'md' ? 'hidden md:flex xl:hidden' : '',
				version === 'xl' ? 'hidden md:hidden xl:flex' : ''
			)}>
			<div
				style={{width: 'calc(100vw - 32px)'}}
				className={cl(
					'flex md:!w-[300px] xl:!w-[400px] flex-col items-start',
					'border border-neutral-200 relative',
					'rounded-3xl !bg-white p-6 transition-all'
				)}>
				<button
					onClick={e => {
						e.preventDefault();
						e.stopPropagation();
						onClose();
					}}
					className={'absolute right-8 top-8'}>
					<IconCross className={'size-4 text-neutral-900 transition-colors group-hover:text-neutral-600'} />
				</button>

				<p className={'text-grey-900 mb-6 font-bold'}>
					{vaultInfo?.name || 'Vault'}
					{' Info'}
				</p>

				<p
					className={'text-grey-700 mb-4 text-left'}
					dangerouslySetInnerHTML={vaultInfo ? createMarkup(vaultInfo?.description || '') : {__html: ''}}
				/>

				<div className={'text-grey-700 flex flex-col items-start'}>
					<p className={'font-bold'}>{'APY'}</p>
					<div className={'flex  justify-start gap-6 text-xs'}>
						<p className={'text-left'}>
							{'Last week '}
							{formatPercent((vaultInfo?.apr?.points?.weekAgo || 0) * 100)}
						</p>
						<p className={'text-left'}>
							{'Last Month '}
							{formatPercent((vaultInfo?.apr?.points?.monthAgo || 0) * 100)}
						</p>
						<p className={'text-left'}>
							{'Inception '}
							{formatPercent((vaultInfo?.apr?.points?.inception || 0) * 100)}
						</p>
					</div>
				</div>
			</div>
		</Popover.Content>
	);
}

export type TVaultInfoModal =
	| ({
			isOpen?: boolean;
	  } & TYDaemonVault)
	| undefined;

export function SelectVault({
	isOpen,
	onClose,
	onSelect,
	availableVaults
}: {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (value: TYDaemonVault) => void;
	availableVaults: TYDaemonVault[];
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {address} = useWeb3();
	const {getPrice} = usePrices();
	const [vaultInfo, set_vaultInfo] = useState<TVaultInfoModal>(undefined);
	const [filter, set_filter] = useState<'all' | 'token'>('all');
	const [sortDirection, set_sortDirection] = useState<TSortDirection>('');

	const assetPrice = configuration.asset.token
		? getPrice({
				address: configuration.asset.token?.address,
				chainID: configuration.asset.token?.chainID
			}) || zeroNormalizedBN
		: zeroNormalizedBN;

	const underlyingTokenFilteredVaults = availableVaults.filter(
		vault => vault.token.address === configuration.asset.token?.address
	);

	const filteredVaults = useMemo(() => {
		if (filter === 'token') {
			return underlyingTokenFilteredVaults;
		}
		return availableVaults;
	}, [availableVaults, filter, underlyingTokenFilteredVaults]);

	const sortedVaults = useMemo(() => {
		if (!filteredVaults) {
			return [];
		}
		return filteredVaults.toSorted((a, b): number =>
			numberSort({
				a: a.apr?.netAPR || 0,
				b: b.apr?.netAPR || 0,
				sortDirection: sortDirection || 'desc'
			})
		);
	}, [filteredVaults, sortDirection]);

	const onChangeSort = useCallback(() => {
		if (sortDirection === '') {
			set_sortDirection('desc');
			return;
		}
		if (sortDirection === 'desc') {
			set_sortDirection('asc');
			return;
		}
		set_sortDirection('');
	}, [sortDirection]);

	return (
		<Transition
			show={isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000] !overflow-visible'}
				onClose={() => null}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div
						onClick={onClose}
						className={'bg-grey-500/80 fixed inset-0 !overflow-visible backdrop-blur-md transition-opacity'}
					/>
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen overflow-y-auto px-0 md:px-4'}>
					<div
						onClick={onClose}
						className={'flex min-h-full items-end justify-center p-4 text-center md:items-center md:p-0'}>
						<TransitionChild
							as={Fragment}
							enter={'ease-out duration-300'}
							enterFrom={'opacity-0 translate-y-4 md:translate-y-0 md:scale-95'}
							enterTo={'opacity-100 translate-y-0 md:scale-100'}
							leave={'ease-in duration-200'}
							leaveFrom={'opacity-100 translate-y-0 md:scale-100'}
							leaveTo={'opacity-0 translate-y-4 md:translate-y-0 md:scale-95'}>
							<div className={'w-full md:w-[560px]'}>
								<Popover.Root open={vaultInfo && vaultInfo.isOpen}>
									<Popover.Anchor>
										<DialogPanel
											className={cl(
												'relative overflow-hidden rounded-3xl !bg-white transition-all',
												'w-full p-2 md:p-6 flex flex-col items-center justify-center'
											)}>
											<div className={'flex w-full items-start justify-between px-4 pb-2 pt-4'}>
												<div className={'mb-6 flex gap-2'}>
													<button
														className={cl(
															'text-grey-800 border-grey-200 hover:bg-grey-200 rounded-2xl border px-6 py-1 font-medium',
															filter === 'all' ? 'border-grey-800' : ''
														)}
														onClick={() => set_filter('all')}>
														{'All'}
													</button>
													{configuration.asset.token &&
														underlyingTokenFilteredVaults.length > 0 && (
															<button
																className={cl(
																	'text-grey-800 border-grey-200 hover:bg-grey-200 rounded-2xl border px-6 py-1 font-medium',
																	filter === 'token' ? 'border-grey-800' : ''
																)}
																onClick={() => set_filter('token')}>
																{configuration.asset.token.symbol}
															</button>
														)}
												</div>

												<button
													className={'group'}
													onClick={onClose}>
													<IconCross
														className={
															'size-4 text-neutral-900 transition-colors group-hover:text-neutral-600'
														}
													/>
												</button>
											</div>
											<div
												className={
													'text-grey-700 mb-2 flex w-full justify-between px-4 text-xs'
												}>
												<div className={'flex gap-1'}>
													{'Asset'}
													{/* <HeaderTooltip message={'Asset'} /> */}
												</div>
												<div className={'flex'}>
													<button
														className={cl(
															'hover:text-grey-800 mr-5 flex gap-1',
															sortDirection ? 'text-grey-800' : 'text-grey-700'
														)}
														onClick={onChangeSort}>
														{'APY'}
														<IconChevronPlain
															className={cl(
																'size-4 min-w-[16px]',
																sortDirection === 'asc' ? 'rotate-180' : ''
															)}
														/>
													</button>
													{/* <div className={'mr-5 flex gap-1'}>
											{'Risk'}
											<HeaderTooltip message={'Risk'} />
										</div> */}
													<div className={'mr-1.5 flex gap-1'}>{'Info'}</div>
												</div>
											</div>
											<div className={'scrollable flex h-96 w-full flex-col gap-2'}>
												{sortedVaults.map(vault => (
													<Vault
														key={`${vault.address}-${vault.chainID}`}
														vault={vault}
														assetPrice={assetPrice}
														isDisabled={!address}
														onSelect={onSelect}
														onClose={onClose}
														onChangeVaultInfo={set_vaultInfo}
													/>
												))}
											</div>
										</DialogPanel>
										<VaultInfo
											vaultInfo={vaultInfo}
											version={'sm'}
											onClose={() =>
												set_vaultInfo(vaultInfo ? {...vaultInfo, isOpen: false} : undefined)
											}
										/>
										<VaultInfo
											vaultInfo={vaultInfo}
											version={'md'}
											onClose={() =>
												set_vaultInfo(vaultInfo ? {...vaultInfo, isOpen: false} : undefined)
											}
										/>
										<VaultInfo
											vaultInfo={vaultInfo}
											version={'xl'}
											onClose={() =>
												set_vaultInfo(vaultInfo ? {...vaultInfo, isOpen: false} : undefined)
											}
										/>
									</Popover.Anchor>
								</Popover.Root>
							</div>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
