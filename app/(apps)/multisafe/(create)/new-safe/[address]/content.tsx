'use client';

import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {usePlausible} from 'next-plausible';
import {Fragment, useMemo, useState} from 'react';

import {Button} from '@lib/components/Button';
import {SafeDetailsCurtain} from '@lib/components/Curtains/SafeDetailsCurtain';
import {IconEdit} from '@lib/components/icons/IconEdit';
import {ReadonlySmolAddressInput} from '@lib/components/SmolAddressInput.readonly';
import {IconBug} from '@lib/icons/IconBug';
import {IconChevronBottom} from '@lib/icons/IconChevronBottom';
import {IconDoc} from '@lib/icons/IconDoc';
import {toBigInt} from '@lib/utils/numbers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {toAddress} from '@lib/utils/tools.addresses';
import {CHAINS} from '@lib/utils/tools.chains';
import ChainStatus from 'app/(apps)/multisafe/components/ChainStatus';
import {SINGLETON_L2, SINGLETON_L2_DDP} from 'app/(apps)/multisafe/constants';
import {useMultisafe} from 'app/(apps)/multisafe/contexts/useMultisafe';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {ReactElement} from 'react';

export function SafeCreateContent({safeAddress}: {safeAddress: TAddress}): ReactElement {
	const searchParams = useSearchParams();
	const {onClickFAQ} = useMultisafe();
	const plausible = usePlausible();
	const [shouldUseTestnets, setShouldUseTestnets] = useState<boolean>(false);
	const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
	const address = toAddress((safeAddress || '') as string);
	const owners = ((searchParams?.get('owners') || '') as string).split('_').map(toAddress);
	const threshold = parseInt(searchParams?.get('threshold') as string, 10);
	const salt = toBigInt(searchParams?.get('salt') as string);
	const singleton = searchParams?.get('singleton') == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP;
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
		<Fragment>
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
						onClick={() => setShouldUseTestnets(!shouldUseTestnets)}>
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
						<Link href={`/multisafe/new-safe?${linkToEdit}`}>
							<div className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}>
								<IconEdit className={'size-4'} />
							</div>
						</Link>
					</div>
					<div className={'mt-2'}>
						<button
							onClick={() => setIsInfoOpen(true)}
							className={'flex cursor-pointer items-center pl-1 text-neutral-600'}>
							<p className={'pr-1 text-xs'}>{'Check safe details'}</p>
							<IconChevronBottom className={'size-3.5 -rotate-90 transition-all duration-100'} />
						</button>
					</div>
				</div>

				<div>
					<div className={'mb-2'}>
						<p className={'font-medium'}>{'Deployments'}</p>
					</div>
					<div className={'flex flex-col pb-6'}>
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
			<SafeDetailsCurtain
				isOpen={isInfoOpen}
				onOpenChange={setIsInfoOpen}
				address={address}
				owners={owners}
				threshold={threshold}
				seed={salt}
			/>
		</Fragment>
	);
}
