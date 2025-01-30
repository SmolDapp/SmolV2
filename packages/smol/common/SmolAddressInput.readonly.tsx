'use client';

import {AvatarWrapper} from '@lib/common/Avatar';
import {TextTruncate} from '@lib/common/TextTruncate';
import {useClusters} from '@lib/hooks/web3/useClusters';
import Link from 'next/link';
import React from 'react';
import {mainnet} from 'viem/chains';
import {useEnsName} from 'wagmi';

import {IconLinkOut} from '@lib/icons/IconLinkOut';
import {cl} from '@lib/utils/helpers';
import {toAddress, truncateHex} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {ReactElement} from 'react';

export function ReadonlySmolAddressInput(props: {value: TAddress}): ReactElement {
	const {data: ens} = useEnsName({address: props.value, chainId: mainnet.id});
	const clusters = useClusters({address: props.value});

	return (
		<div className={'max-w-108 group relative size-full rounded-lg'}>
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
						value={ens || clusters?.name || truncateHex(props.value, 5)}
					/>
					<TextTruncate
						value={toAddress(props.value)}
						className={'pointer-events-auto translate-y-0 text-neutral-600 opacity-100'}
					/>
				</div>
				<div className={'w-fit flex-1'}>
					<Link
						href={`${mainnet.blockExplorers.default.url}/address/${toAddress(props.value)}`}
						target={'_blank'}>
						<div
							className={cl(
								'cursor-alias',
								'flex items-center gap-4 rounded-[4px] p-4 w-22',
								'bg-neutral-200 hover:bg-neutral-300 transition-colors'
							)}>
							<div
								className={'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
								<AvatarWrapper
									key={props.value}
									address={toAddress(props.value)}
									sizeClassname={'h-8 w-8 min-w-8'}
								/>
							</div>

							<IconLinkOut
								className={cl(
									'size-4 min-w-4 text-neutral-500/60',
									'transition-colors hover:text-neutral-600'
								)}
							/>
						</div>
					</Link>
				</div>
			</label>
		</div>
	);
}
