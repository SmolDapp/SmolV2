'use client';

import {IconChevron} from '@lib/icons/IconChevron';
import {Command, CommandEmpty, CommandInput, CommandItem} from '@lib/primitives/Commands';
import {cl} from '@lib/utils/helpers';
import * as Popover from '@radix-ui/react-popover';
import {useIsMounted} from '@react-hookz/web';
import {CommandList} from 'cmdk';
import {useCallback, useState} from 'react';
import {useChainId, useChains, useSwitchChain} from 'wagmi';

import {ImageWithFallback} from 'packages/smol/common/ImageWithFallback';

import type {ReactElement} from 'react';

export function NetworkPopoverSelector(): ReactElement {
	const isMounted = useIsMounted();
	const chainID = useChainId();
	const chains = useChains();
	const [isOpen, setIsOpen] = useState(false);
	const {switchChainAsync} = useSwitchChain();
	const getCurrentNetwork = useCallback(
		() => chains.find((network): boolean => network.id === chainID),
		[chainID, chains]
	);
	const currentNetwork = getCurrentNetwork();

	return (
		<Popover.Root
			open={isOpen}
			onOpenChange={setIsOpen}>
			<Popover.Trigger asChild>
				<button
					role={'combobox'}
					aria-expanded={isOpen}
					className={cl(
						'flex w-full items-center justify-between rounded-lg p-2',
						'bg-neutral-200 hover:bg-neutral-300 transition-colors '
					)}>
					<div className={'flex w-full max-w-full justify-between gap-1 text-left text-xs'}>
						{isMounted() && currentNetwork?.name ? (
							<div className={'flex w-full max-w-full gap-2 truncate'}>
								<ImageWithFallback
									width={16}
									height={16}
									alt={currentNetwork.name}
									src={`${process.env.SMOL_ASSETS_URL}/chain/${currentNetwork.id}/logo-32.png`}
								/>
								<p className={'truncate'}>{currentNetwork?.name}</p>
							</div>
						) : (
							<p className={'truncate'}>{'Select chain'}</p>
						)}
						<div>
							<IconChevron className={'ml-1 size-4 rotate-90'} />
						</div>
					</div>
				</button>
			</Popover.Trigger>

			<Popover.Content
				className={cl(
					'z-[100] min-w-[8rem] overflow-hidden rounded-md border border-neutral-400 bg-neutral-0 p-1',
					'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[side=bottom]:slide-in-from-top-2',
					'DropdownMenuContent'
				)}
				style={{boxShadow: 'rgba(36, 40, 51, 0.08) 0px 0px 20px 8px'}}>
				<Command>
					<CommandInput placeholder={'Search chain...'} />
					<CommandEmpty>{'No chain found.'}</CommandEmpty>
					<CommandList className={'max-h-48 overflow-y-auto'}>
						{chains.map(network => (
							<CommandItem
								key={network.id}
								value={network.name}
								className={cl(
									'relative flex cursor-pointer items-center rounded-lg p-2',
									'outline-none select-none transition-colors',
									'text-xs text-neutral-800 group',
									'focus:bg-neutral-300',
									'bg-neutral-0 hover:bg-neutral-200',
									currentNetwork?.id === network.id ? 'bg-neutral-200' : ''
								)}
								onSelect={selectedNetwork => {
									if (selectedNetwork === currentNetwork?.name) {
										return;
									}
									const chain = chains.find(
										network => network.name.toLowerCase() === selectedNetwork.toLocaleLowerCase()
									);
									switchChainAsync({chainId: chain?.id || 1});
									setIsOpen(false);
								}}>
								<ImageWithFallback
									width={16}
									height={16}
									className={'mr-2'}
									alt={network.name}
									src={`${process.env.SMOL_ASSETS_URL}/chain/${network.id}/logo-32.png`}
								/>
								{network.name}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</Popover.Content>
		</Popover.Root>
	);
}
