import {type ReactElement, useMemo, useState} from 'react';
import Image from 'next/image';
import {CommandInput, CommandList} from 'cmdk';
import {Command, CommandEmpty, CommandItem} from 'lib/primitives/Commands';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {toSafeChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl} from '@builtbymom/web3/utils';
import * as Popover from '@radix-ui/react-popover';
import {useIsMounted} from '@lib/hooks/useIsMounted';
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
							'z-20 relative transition-all size-6 md:size-10',
							'flex justify-center items-center cursor-pointer',
							'hover:opacity-70'
						)}>
						<div className={'flex size-6 items-center justify-center md:size-10'}>
							{isMounted && currentNetwork?.name ? (
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
					'z-30 min-w-[8rem] overflow-hidden rounded-3xl bg-neutral-0 p-1.5',
					'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[side=bottom]:slide-in-from-top-2',
					'DropdownMenuContent'
				)}
				style={{
					boxShadow: 'rgba(9, 18, 26, 0.08) 0px 8px 20px 0px '
				}}>
				<Command>
					<div className={'p-2.5 pb-3'}>
						<CommandInput
							className={cl(
								'rounded-2xl py-3 px-4 text-base',
								'placeholder:transition-colors transition-all',
								'disabled:cursor-not-allowed disabled:opacity-40',
								'placeholder:text-grey-700 focus:border-grey-300 text-grey-800 caret-grey-800 border-transparent bg-grey-100'
							)}
							placeholder={'Search chain...'}
						/>
					</div>
					<CommandEmpty className={'text-grey-700 pb-4 pt-2 text-center text-xs'}>
						{'No chains found.'}
					</CommandEmpty>
					<CommandList className={'max-h-48 overflow-y-auto'}>
						{networks.map(network => (
							<CommandItem
								key={network.id}
								value={network.name}
								className={cl(
									'relative flex cursor-pointer items-center !rounded-lg !p-2.5 mt-1',
									'outline-none select-none transition-colors',
									'text-xs text-neutral-800 group',
									'focus:bg-grey-100',
									'hover:bg-grey-100',
									currentNetwork?.id === network.id ? 'bg-grey-100 !cursor-default' : ''
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
								<Image
									width={20}
									height={20}
									alt={network.name}
									src={`${process.env.SMOL_ASSETS_URL}/chain/${network.id}/logo.svg`}
								/>
								<p className={'ml-2'}>{network.name}</p>
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</Popover.Content>
		</Popover.Root>
	);
}
