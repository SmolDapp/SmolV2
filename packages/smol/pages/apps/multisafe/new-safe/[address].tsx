import React, {Fragment, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import {mainnet} from 'viem/chains';
import {cl, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {MultisafeAppInfo} from '@smolSections/Multisafe/AppInfo';
import ChainStatus from '@smolSections/Multisafe/ChainStatus';
import {SINGLETON_L2, SINGLETON_L2_DDP} from '@smolSections/Multisafe/constants';
import {MultisafeContextApp, useMultisafe} from '@smolSections/Multisafe/useMultisafe';
import {ReadonlySmolAddressInput} from '@lib/common/SmolAddressInput.readonly';
import {IconBug} from '@lib/icons/IconBug';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';
import {IconDoc} from '@lib/icons/IconDoc';
import {IconEdit} from '@lib/icons/IconEdit';
import {Button} from '@lib/primitives/Button';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {CHAINS} from '@lib/utils/tools.chains';

import type {ReactElement} from 'react';

function Safe(): ReactElement {
	const router = useRouter();
	const {onClickFAQ} = useMultisafe();
	const plausible = usePlausible();
	const [shouldDisplayDetails, set_shouldDisplayDetails] = useState<boolean>(false);
	const [shouldUseTestnets, set_shouldUseTestnets] = useState<boolean>(false);
	const address = toAddress((router.query.address || '') as string);
	const owners = ((router.query.owners || '') as string).split('_').map(toAddress);
	const threshold = parseInt(router.query.threshold as string, 10);
	const salt = toBigInt(router.query.salt as string);
	const singleton = router.query.singleton == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP;
	const supportedChains = useMemo(() => Object.values(CHAINS).filter(e => e.isMultisafeSupported), []);

	const linkToEdit = useMemo(() => {
		const URLQueryParam = new URLSearchParams();

		URLQueryParam.set('address', address);
		URLQueryParam.set('owners', owners.join('_'));
		URLQueryParam.set('threshold', threshold.toString());
		URLQueryParam.set('singleton', singleton === SINGLETON_L2 ? 'ssf' : 'ddp');
		URLQueryParam.set('salt', salt.toString());
		return URLQueryParam.toString();
	}, [address, owners, threshold, singleton, salt]);

	return (
		<div className={'grid w-full max-w-[600px] gap-6'}>
			<div className={'-mt-2 flex flex-wrap gap-2 text-xs'}>
				<Button
					className={'!h-8 !text-xs'}
					variant={'light'}
					onClick={() => {
						plausible(PLAUSIBLE_EVENTS.OPEN_MULTISAFE_FAQ_CURTAIN);
						onClickFAQ();
					}}>
					<IconDoc className={'mr-2 size-3'} />
					{'View FAQ'}
				</Button>
				<Button
					className={'!h-8 !text-xs'}
					variant={shouldUseTestnets ? 'filled' : 'light'}
					onClick={() => set_shouldUseTestnets(!shouldUseTestnets)}>
					<IconBug className={'mr-2 size-3'} />
					{'Enable Testnets'}
				</Button>
			</div>

			<div>
				<div className={'mb-2'}>
					<p className={'font-medium'}>{'Safe Address'}</p>
				</div>
				<div className={'relative flex items-center'}>
					<ReadonlySmolAddressInput value={address} />
					<Link href={`/apps/multisafe/new-safe?${linkToEdit}`}>
						<div className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}>
							<IconEdit className={'size-4'} />
						</div>
					</Link>
				</div>
				<div className={'mt-2'}>
					<button
						onClick={(): void => set_shouldDisplayDetails(!shouldDisplayDetails)}
						className={'flex cursor-pointer items-center pl-1 text-neutral-600'}>
						<p className={'pr-1 text-xs'}>{'Check safe details'}</p>
						<IconChevronBottom
							className={cl(
								'size-3.5 transition-all duration-100 transform',
								!shouldDisplayDetails ? '-rotate-90' : '-rotate-0'
							)}
						/>
					</button>

					{shouldDisplayDetails && (
						<div className={'my-1 grid w-full gap-4 rounded-md bg-neutral-200 p-4 md:w-auto'}>
							<div>
								<small className={'text-neutral-600'}>{'Owners'}</small>
								<div>
									{owners.map(owner => (
										<Link
											key={owner}
											target={'_blank'}
											href={`${mainnet.blockExplorers.default.url}/address/${owner}`}>
											<p
												className={
													'font-number cursor-alias text-sm font-medium hover:underline'
												}>
												{owner}
											</p>
										</Link>
									))}
								</div>
							</div>
							<div>
								<small className={'text-neutral-600'}>{'Threshold'}</small>
								<p className={'font-number text-sm font-medium'}>
									{`${threshold} of ${owners.length}`}
								</p>
							</div>
							<div>
								<small className={'text-neutral-600'}>{'Seed'}</small>
								<p className={'font-number break-all text-sm font-medium'}>{salt.toString()}</p>
							</div>
						</div>
					)}
				</div>
			</div>

			<div>
				<div className={'mb-2'}>
					<p className={'font-medium'}>{'Deployments'}</p>
				</div>
				<div className={'flex flex-col overflow-hidden'}>
					<div className={'grid grid-cols-1 gap-2'}>
						{supportedChains
							.filter(chain => !chain.testnet)
							.map(
								(chain): ReactElement => (
									<ChainStatus
										key={chain.id}
										chain={chain}
										safeAddress={toAddress(address)}
										owners={owners || []}
										threshold={threshold || 0}
										singleton={singleton}
										salt={salt || 0n}
									/>
								)
							)}
					</div>
					{shouldUseTestnets && (
						<div className={'mt-6 grid gap-2 border-t border-neutral-100 pt-6'}>
							{supportedChains
								.filter(chain => chain.testnet)
								.map(
									(chain): ReactElement => (
										<ChainStatus
											key={chain.id}
											chain={chain}
											safeAddress={toAddress(address)}
											owners={owners || []}
											threshold={threshold || 0}
											singleton={singleton}
											salt={salt || 0n}
										/>
									)
								)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function MultisafeDeployNewWrapper(): ReactElement {
	const router = useRouter();
	if (!router.isReady) {
		return <Fragment />;
	}

	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}

MultisafeDeployNewWrapper.AppName = 'One new Safe, coming right up.';
MultisafeDeployNewWrapper.AppDescription =
	'Create your Multisafe by choosing it’s owners, and setting the amount of signers needed for transactions. (P.s you can customise your safe with a prefix and suffix if you want).';
MultisafeDeployNewWrapper.AppInfo = <MultisafeAppInfo />;
