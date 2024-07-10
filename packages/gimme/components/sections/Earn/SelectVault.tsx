import {Fragment, type ReactElement, useCallback, useMemo, useState} from 'react';
import {IconCross} from 'packages/lib/icons/IconCross';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {cl, formatPercent} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';
import {usePrices} from '@lib/contexts/usePrices';
import {createMarkup} from '@lib/utils/react/createMarkup';

import {useEarnFlow} from './useEarnFlow';
import {Vault} from './Vault';

import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function SelectVault({
	isOpen,
	onClose,
	onSelect,
	availableVaults,
	isStablecoin
}: {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (value: TYDaemonVault) => void;
	availableVaults: TYDaemonVault[];
	isStablecoin: boolean;
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {address} = useWeb3();

	const {getPrice} = usePrices();

	const [vaultInfo, set_vaultInfo] = useState<TYDaemonVault | undefined>(undefined);

	const onChangeVaultInfo = useCallback((value: TYDaemonVault | undefined) => set_vaultInfo(value), [set_vaultInfo]);

	const [filter, set_filter] = useState<'all' | 'token'>('all');

	const filteredVaults = useMemo(() => {
		if (filter === 'token') {
			return availableVaults.filter(vault => vault.token.address === configuration.asset.token?.address);
		}
		return availableVaults;
	}, [availableVaults, configuration.asset.token?.address, filter]);

	return (
		<Transition
			show={isOpen}
			as={Fragment}>
			<Dialog
				as={'div'}
				className={'relative z-[1000] !overflow-visible'}
				onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter={'ease-out duration-300'}
					enterFrom={'opacity-0'}
					enterTo={'opacity-100'}
					leave={'ease-in duration-200'}
					leaveFrom={'opacity-100'}
					leaveTo={'opacity-0'}>
					<div
						className={'bg-grey-500/80 fixed inset-0 !overflow-visible backdrop-blur-md transition-opacity'}
					/>
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen !overflow-visible overflow-y-auto'}>
					<div
						className={cl(
							'grid max-h-screen grid-cols-9 p-4 grid-rows-4 gap-4 text-center sm:p-0',
							'grid-flow-col'
						)}>
						<TransitionChild
							as={Fragment}
							enter={'ease-out duration-300'}
							enterFrom={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}
							enterTo={'opacity-100 translate-y-0 sm:scale-100'}
							leave={'ease-in duration-200'}
							leaveFrom={'opacity-100 translate-y-0 sm:scale-100'}
							leaveTo={'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'}>
							<DialogPanel
								className={cl(
									'relative overflow-hidden  h-full flex flex-col items-center justify-center rounded-3xl !bg-white !px-2 !pt-2 !pb-2 transition-all',
									'border border-grey-200',
									'col-span-9 row-span-2 row-start-3',
									'xl:col-span-3 xl:col-start-4',
									'lg:col-span-5 lg:col-start-3',
									'md:col-span-5 md:col-start-3 md:row-start-2 md:row-span-2'
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
										{isStablecoin && configuration.asset.token && (
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
								<div className={'text-grey-700 mb-2 flex w-full justify-between px-4 text-xs'}>
									<div className={'flex gap-1'}>
										{'Asset'}
										{/* <HeaderTooltip message={'Asset'} /> */}
									</div>
									<div className={'flex'}>
										<div className={'mr-5 flex gap-1'}>
											{'APY'}
											{/* <HeaderTooltip message={'APY'} /> */}
										</div>
										{/* <div className={'mr-5 flex gap-1'}>
											{'Risk'}
											<HeaderTooltip message={'Risk'} />
										</div> */}
										<div className={'mr-1.5 flex gap-1'}>{'Info'}</div>
									</div>
								</div>
								<div className={'scrollable flex h-96 w-full flex-col gap-2'}>
									{filteredVaults.map(vault => (
										<Vault
											key={`${vault.address}-${vault.chainID}`}
											vault={vault}
											price={getPrice({address: vault.token.address, chainID: vault.chainID})}
											isDisabled={!address}
											onSelect={onSelect}
											onClose={onClose}
											onChangeVaultInfo={onChangeVaultInfo}
										/>
									))}
								</div>
							</DialogPanel>
						</TransitionChild>

						{vaultInfo && (
							<div
								className={cl(
									'col-span-9 col-start-1 row-start-1 items-end row-span-2 flex sm:text-base',
									'xl: col-span-2 xl:col-start-7',
									'lg:col-span-2 lg:col-start-8 lg:row-span-2 lg:row-start-2 lg:max-w-[424px] lg:text-base lg:items-start',
									'md:col-span-5 md:col-start-3 md:row-span-1 md:row-start-1 items-start md:text-xs'
								)}>
								<div
									className={
										'flex w-full flex-col items-start overflow-hidden rounded-3xl !bg-white p-6 transition-all'
									}>
									<p className={'text-grey-900 mb-2 font-bold lg:mb-6'}>
										{vaultInfo.name}
										{' Info'}
									</p>
									<p
										className={'text-grey-700 mb-4 text-left lg:mb-8'}
										dangerouslySetInnerHTML={createMarkup(vaultInfo.description)}
									/>

									<div className={'text-grey-700 flex flex-col items-start'}>
										<p className={'font-bold'}>{'APY'}</p>
										<div className={'flex  justify-start gap-6 text-xs'}>
											<p className={'text-left'}>
												{'Last week '}
												{formatPercent(vaultInfo.apr.points.weekAgo * 100)}
											</p>
											<p className={'text-left'}>
												{'Last Month '}
												{formatPercent(vaultInfo.apr.points.monthAgo * 100)}
											</p>
											<p className={'text-left'}>
												{'Inception '}
												{formatPercent(vaultInfo.apr.points.inception * 100)}
											</p>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}
