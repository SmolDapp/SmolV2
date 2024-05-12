import React, {useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {mainnet} from 'viem/chains';
import {useEnsName} from 'wagmi';
import {cl, toAddress, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import ChainStatus from '@multisafe/components/ChainStatus';
import {MultisafeContextApp} from '@multisafe/contexts/useMultisafe';
import {SINGLETON_L2, SINGLETON_L2_DDP} from '@multisafeUtils/constants';
import {AvatarWrapper} from '@lib/common/Avatar';
import {TextTruncate} from '@lib/common/TextTruncate';
import {IconEdit} from '@lib/icons/IconEdit';
import {SUPPORTED_MULTICHAINS} from '@lib/utils/constants';

import type {GetServerSideProps} from 'next';
import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';

function FakeSmolAddressInput(props: {value: TAddress}): ReactElement {
	const {data: ens} = useEnsName({
		address: props.value,
		chainId: mainnet.id
	});
	return (
		<div className={'max-w-108 group relative size-full rounded-[8px]'}>
			<label
				className={cl(
					'h-20 z-20 relative',
					'flex flex-row justify-between items-center cursor-text',
					'p-2 pl-4 group bg-neutral-0 rounded-lg',
					'overflow-hidden border',
					'border-neutral-400'
				)}>
				<div className={'relative w-full pr-2 transition-all'}>
					<input
						disabled
						className={cl(
							'w-full border-none bg-transparent p-0 text-xl transition-all pr-6',
							'text-neutral-900 placeholder:text-neutral-600 caret-neutral-700',
							'focus:placeholder:text-neutral-300 placeholder:transition-colors'
						)}
						type={'text'}
						placeholder={'0x...'}
						autoComplete={'off'}
						autoCorrect={'off'}
						spellCheck={'false'}
						value={ens || truncateHex(props.value, 5)}
					/>
					<TextTruncate
						value={toAddress(props.value)}
						className={'pointer-events-auto translate-y-0 text-neutral-600 opacity-100'}
					/>
				</div>
				<div className={'w-fit flex-1'}>
					<div className={cl('flex items-center gap-4 rounded-[4px] p-4', 'bg-neutral-200')}>
						<div className={'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
							<AvatarWrapper
								address={toAddress(props.value)}
								sizeClassname={'h-8 w-8 min-w-8'}
							/>
						</div>
					</div>
				</div>
			</label>
		</div>
	);
}

function Safe(): ReactElement {
	const router = useRouter();
	const [shouldUseTestnets, set_shouldUseTestnets] = useState<boolean>(false);
	const address = toAddress((router.query.address || '') as string);
	const owners = ((router.query.owners || '') as string).split('_').map(toAddress);
	const threshold = parseInt(router.query.threshold as string, 10);
	const salt = toBigInt(router.query.salt as string);
	const singleton = router.query.singleton == 'ssf' ? SINGLETON_L2 : SINGLETON_L2_DDP;

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
			<div>
				<div className={'mb-2'}>
					<p className={'font-medium'}>{'Safe Address'}</p>
				</div>
				<div className={'relative flex items-center'}>
					<FakeSmolAddressInput value={address} />
					<Link href={`/new-safe?${linkToEdit}`}>
						<div className={'mx-2 p-2 text-neutral-600 transition-colors hover:text-neutral-700'}>
							<IconEdit className={'size-4'} />
						</div>
					</Link>
				</div>
			</div>

			<div>
				<div className={'mb-2'}>
					<p className={'font-medium'}>{'Deployments'}</p>
				</div>
				<div className={'flex flex-col'}>
					<div className={'grid grid-cols-1 gap-2'}>
						{SUPPORTED_MULTICHAINS.filter(
							(chain): boolean => ![5, 324, 1337, 84531].includes(chain.id)
						).map(
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
						<div className={'mt-6 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-6 md:grid-cols-3'}>
							{SUPPORTED_MULTICHAINS.filter((chain): boolean => ![324].includes(chain.id))
								.filter((chain): boolean => [5, 1337, 84531].includes(chain.id))
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

export default function MultisafeWrapper(): ReactElement {
	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}

MultisafeWrapper.AppName = 'Your safe, your rules';
MultisafeWrapper.AppDescription = 'This is your safe, deploy if everywhere for 4.20$ per network!';
MultisafeWrapper.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);
export const getServerSideProps = (async () => ({props: {}})) satisfies GetServerSideProps;
