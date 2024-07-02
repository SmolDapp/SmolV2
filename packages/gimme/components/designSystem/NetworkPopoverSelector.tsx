import {type ReactElement, useMemo, useState} from 'react';
import Image from 'next/image';
import {CommandList} from 'cmdk';
import {ImageWithFallback} from 'lib/common/ImageWithFallback';
import {Command, CommandEmpty, CommandInput, CommandItem} from 'lib/primitives/Commands';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toSafeChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl} from '@builtbymom/web3/utils';
import * as Popover from '@radix-ui/react-popover';
import {useIsMounted} from '@react-hookz/web';
import {supportedNetworks} from '@lib/utils/tools.chains';

import type {Chain} from 'viem';

export function NetworkPopoverSelector(props: {networks?: Chain[]}): ReactElement {
	const networks = props.networks || supportedNetworks;
	const {onSwitchChain, chainID} = useWeb3();
	const safeChainID = toSafeChainID(chainID, Number(process.env.BASE_CHAINID));
	const isMounted = useIsMounted();

	const isDev = process.env.NODE_ENV === 'development' && Boolean(process.env.SHOULD_USE_FORKNET);

	const currentNetwork = useMemo(
		() =>
			supportedNetworks.find(
				(network): boolean => network.id === safeChainID || (isDev && network.id === chainID)
			),
		[safeChainID, isDev, chainID]
	);

	const [isOpen, set_isOpen] = useState(false);

	return (
		<Popover.Root
			open={isOpen}
			onOpenChange={set_isOpen}>
			<Popover.Trigger asChild>
				<div className={'relative rounded-lg'}>
					<button
						role={'combobox'}
						aria-expanded={isOpen}
						className={cl(
							'z-20 relative transition-all size-10',
							'flex justify-center items-center cursor-pointer',
							'hover:opacity-70'
						)}>
						<div className={'flex items-center justify-center'}>
							{isMounted() && currentNetwork?.name ? (
								<Image
									width={40}
									height={40}
									alt={currentNetwork.name}
									src={`${process.env.SMOL_ASSETS_URL}/chain/${currentNetwork.id}/logo.svg`}
								/>
							) : (
								<div className={'rounded-full bg-neutral-400'} />
							)}
						</div>
					</button>
				</div>
			</Popover.Trigger>

			<Popover.Content
				className={cl(
					'z-50 min-w-[8rem] overflow-hidden rounded-md border border-neutral-400 bg-neutral-0 p-1',
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
						{networks.map(network => (
							<CommandItem
								key={network.id}
								value={network.name}
								className={cl(
									'relative flex cursor-pointer items-center rounded-lg p-2',
									'outline-none select-none transition-colors',
									'text-xs text-neutral-800 group',
									'focus:bg-neutral-300',
									'hover:bg-neutral-200',
									currentNetwork?.id === network.id ? 'bg-neutral-200' : ''
								)}
								onSelect={selectedNetwork => {
									if (selectedNetwork === currentNetwork?.name) {
										return;
									}
									const chain = networks.find(
										network => network.name.toLowerCase() === selectedNetwork.toLocaleLowerCase()
									);
									onSwitchChain(chain?.id || 1);
									set_isOpen(false);
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
