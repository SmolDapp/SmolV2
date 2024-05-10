import React, {useMemo} from 'react';
import {isZeroAddress, toAddress} from '@builtbymom/web3/utils';
import ChainStatus from '@multisafe/components/ChainStatus';
import {AddressLike} from '@multisafeCommons/AddressLike';
import {Renderable} from '@multisafeCommons/Renderable';
import IconRefresh from '@multisafeIcons/IconRefresh';
import {SINGLETON_L2, SINGLETON_L2_DDP} from '@multisafeUtils/constants';
import {CHAINS} from '@lib/utils/tools.chains.ts';

import type {ReactElement} from 'react';
import type {TNewSafe} from '@multisafe/components/4.ViewNewSafe';

type TPossibleSafe = {
	possibleSafe: TNewSafe;
	prefix: string;
	suffix: string;
	currentSeed: bigint;
	factory: 'ssf' | 'ddp';
	shouldUseTestnets: boolean;
	onGenerate: VoidFunction;
};
function PossibleSafe({
	possibleSafe,
	prefix,
	suffix,
	currentSeed,
	factory,
	shouldUseTestnets,
	onGenerate
}: TPossibleSafe): ReactElement {
	const {address, owners, threshold, salt} = possibleSafe as TNewSafe;
	const supportedNetworks = useMemo(() => {
		return Object.values(CHAINS).filter(e => e.isMultisafeSupported);
	}, []);

	return (
		<div className={'p-4 pt-0 md:p-6 md:pt-0'}>
			<div className={'box-100 relative p-4 md:px-6'}>
				{possibleSafe?.prefix !== prefix ||
				possibleSafe?.suffix !== suffix ||
				possibleSafe.singleton !== (factory == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP) ||
				possibleSafe.salt !== currentSeed ? (
					<>
						<div className={'box-0 absolute right-2 top-2 hidden w-52 flex-row p-2 text-xs md:flex'}>
							<button
								className={'mr-1 mt-0.5 size-3 min-w-[16px]'}
								disabled={owners.some((owner): boolean => !owner || isZeroAddress(owner))}
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.currentTarget.blur();
									onGenerate();
								}}>
								<IconRefresh
									className={
										'size-3 min-w-[16px] cursor-pointer text-neutral-500 transition-colors hover:text-neutral-900'
									}
								/>
							</button>
							{'Looks like you changed the Safe configuration, please hit generate again.'}
						</div>
						<div className={'absolute right-2 top-2 block p-2 text-xs md:hidden'}>
							<button
								className={'mr-1 mt-0.5 size-3 min-w-[16px]'}
								disabled={owners.some((owner): boolean => !owner || isZeroAddress(owner))}
								onClick={(e: React.MouseEvent<HTMLButtonElement>): void => {
									e.currentTarget.blur();
									onGenerate();
								}}>
								<IconRefresh
									className={
										'size-3 min-w-[16px] cursor-pointer text-neutral-500 transition-colors hover:text-neutral-900'
									}
								/>
							</button>
						</div>
					</>
				) : null}
				<div className={'grid grid-cols-1 gap-20 transition-colors'}>
					<div className={'flex flex-col gap-4'}>
						<div className={'flex flex-col'}>
							<small>{'Safe Address '}</small>
							<b className={'font-number break-all text-sm md:text-base'}>
								<Renderable
									shouldRender={!!address}
									fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
									<AddressLike address={address} />
								</Renderable>
							</b>
						</div>
						<div className={'flex flex-col'}>
							<small>{'Owners '}</small>
							<Renderable
								shouldRender={!!owners && owners.length > 0}
								fallback={
									<div>
										<b className={'font-number block text-neutral-600'}>{'-'}</b>
										<b className={'font-number block text-neutral-600'}>{'-'}</b>
									</div>
								}>
								<div>
									{(owners || []).map(
										(owner): ReactElement => (
											<b
												key={owner}
												className={'font-number addr block text-sm md:text-base'}>
												<AddressLike address={owner} />
											</b>
										)
									)}
								</div>
							</Renderable>
						</div>
						<div className={'flex flex-col'}>
							<small>{'Threshold '}</small>
							<b className={'font-number block'}>
								<Renderable
									shouldRender={!!threshold}
									fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
									{`${threshold || 0} of ${(owners || []).length}`}
								</Renderable>
							</b>
						</div>
						<div className={'flex flex-col'}>
							<small>{'Deployment status '}</small>
							<Renderable
								shouldRender={!!address}
								fallback={<span className={'text-neutral-600'}>{'-'}</span>}>
								<div className={'mt-1 grid grid-cols-1 gap-2 md:gap-4'}>
									{supportedNetworks
										.filter((chain): boolean => ![5, 324, 1337, 84531].includes(chain.id))
										.map(
											(chain): ReactElement => (
												<ChainStatus
													key={chain.id}
													chain={chain}
													safeAddress={toAddress(address)}
													owners={owners || []}
													threshold={threshold || 0}
													singleton={possibleSafe?.singleton}
													salt={salt || 0n}
												/>
											)
										)}
								</div>
								{shouldUseTestnets && (
									<div
										className={
											'mt-6 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-6 md:grid-cols-3 md:gap-4'
										}>
										{supportedNetworks
											.filter((chain): boolean => ![324].includes(chain.id))
											.filter((chain): boolean => [5, 1337, 84531].includes(chain.id))
											.map(
												(chain): ReactElement => (
													<ChainStatus
														key={chain.id}
														chain={chain}
														safeAddress={toAddress(address)}
														owners={owners || []}
														threshold={threshold || 0}
														singleton={possibleSafe?.singleton}
														salt={salt || 0n}
													/>
												)
											)}
									</div>
								)}
							</Renderable>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export {PossibleSafe};
