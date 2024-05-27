import {Fragment, type ReactElement, useCallback, useState} from 'react';
import {IconCross} from 'packages/lib/icons/IconCross';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {usePrices} from '@builtbymom/web3/hooks/usePrices';
import {cl, formatPercent} from '@builtbymom/web3/utils';
import {Dialog, DialogPanel, Transition, TransitionChild} from '@headlessui/react';

import {useEarnFlow} from './useEarnFlow';
import {Vault} from './Vault';

import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function SelectVault({
	isOpen,
	onClose,
	onSelect,
	filteredVaults
}: {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (value: TYDaemonVault) => void;
	filteredVaults: TYDaemonVault[];
}): ReactElement {
	const {configuration} = useEarnFlow();
	const {safeChainID} = useChainID();

	const {data: prices} = usePrices({
		tokens: configuration.asset.token ? [configuration.asset.token] : [],
		chainId: safeChainID
	});
	const price = prices && configuration.asset.token ? prices[configuration.asset.token.address] : undefined;

	const [vaultInfo, set_vaultInfo] = useState<TYDaemonVault | undefined>(undefined);

	const onChangeVaultInfo = useCallback((value: TYDaemonVault | undefined) => set_vaultInfo(value), [set_vaultInfo]);

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
					<div className={'fixed inset-0 !overflow-visible backdrop-blur-sm transition-opacity'} />
				</TransitionChild>

				<div className={'fixed inset-0 z-[1001] w-screen !overflow-visible overflow-y-auto'}>
					<div
						className={cl(
							'col-start-10 grid max-h-screen grid-cols-7 grid-rows-4 gap-4 text-center sm:p-0',
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
									'relative overflow-hidden h-full flex  flex-col items-center justify-center rounded-md !bg-white !px-2 !pt-2 !pb-6 transition-all',
									'shadow-lg',
									'col-span-7 row-span-2 row-start-3',
									'lg:col-span-3 lg:col-start-3',
									'md:col-span-5 md:col-start-2 md:row-start-2 md:row-span-2'
								)}>
								<div className={'flex w-full justify-between p-4'}>
									<p className={'font-bold'}>{'Stables Opportunities'}</p>
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
								<div className={'scrollable flex h-96 w-full flex-col gap-2'}>
									{filteredVaults.map(vault => (
										<Vault
											key={`${vault.address}-${vault.chainID}`}
											vault={vault}
											price={price}
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
									'col-span-7 col-start-1 row-start-1 items-end row-span-2 flex sm:text-base',
									'md:col-span-5 md:col-start-2 md:row-span-1 md:row-start-1 items-start md:text-xs',
									'lg:col-span-2 lg:col-start-6 lg:row-span-2 lg:row-start-2 lg:max-w-[424px] lg:text-base lg:items-start'
								)}>
								<div
									className={
										'flex w-full flex-col items-start overflow-hidden rounded-md !bg-white p-6 shadow-lg transition-all'
									}>
									<p className={'mb-2 font-bold lg:mb-6'}>
										{vaultInfo.name}
										{' Info'}
									</p>
									<p className={'mb-4 text-left text-neutral-600 lg:mb-8'}>
										{'Supplies and borrows DAI on Compound Finance simultaneously to earn COMP.'}
										{'Flashmints are used to mint DAI from MakerDAO to flashlend and fold the'}
										{'position, boosting the APY.'}
									</p>
									<p className={'mb-4 font-bold text-neutral-600 lg:mb-8'}>{'Low Risk'}</p>
									<div className={'flex flex-col items-start text-neutral-600'}>
										<p className={'font-bold'}>{'APY'}</p>
										<div className={'flex justify-start gap-6 text-xs'}>
											<p>
												{'Last week '}
												{formatPercent(vaultInfo.apr.points.weekAgo * 100)}
											</p>
											<p>
												{'Last Month '}
												{formatPercent(vaultInfo.apr.points.monthAgo * 100)}
											</p>
											<p>
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
