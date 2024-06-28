import {type ReactElement, useMemo, useState} from 'react';
import {usePlausible} from 'next-plausible';
import {CommandList} from 'cmdk';
import {toSafeChainID} from '@builtbymom/web3/hooks/useChainID';
import {cl} from '@builtbymom/web3/utils';
import {localhost} from '@builtbymom/web3/utils/wagmi';
import * as Popover from '@radix-ui/react-popover';
import {useIsMounted} from '@react-hookz/web';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {Command, CommandEmpty, CommandInput, CommandItem} from '@lib/primitives/Commands';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {isDev, supportedNetworks, supportedTestNetworks} from '@lib/utils/tools.chains';

export function NetworkInputSelector(props: {
	value: number;
	onChange: (value: number) => void;
	networks?: typeof supportedNetworks;
}): ReactElement {
	const plausible = usePlausible();
	const isMounted = useIsMounted();
	const safeChainID = toSafeChainID(props.value, Number(process.env.BASE_CHAINID));

	/**********************************************************************************************
	 ** networkToUse will be the list of networks to use. If the user has provided a list of
	 ** networks, we will use it. Otherwise, we will use the default supportedNetworks list.
	 ** It's important to note that the provided networks will be filtered by the supportedNetworks
	 ** to only show the networks that are supported by the application, even if the user has
	 ** provided a list of networks.
	 *********************************************************************************************/
	const networksToUse = useMemo(() => {
		if (props.networks) {
			return props.networks.filter(network => supportedNetworks.some(supported => supported.id === network.id));
		}
		return supportedNetworks;
	}, [props.networks]);

	/**********************************************************************************************
	 ** currentNetwork returns the current network object from the list of networks to use. We will
	 ** use the safeChainID or the value provided by the user if we are in development mode.
	 *********************************************************************************************/
	const currentNetwork = useMemo(
		() =>
			networksToUse.find(
				(network): boolean => network.id === safeChainID || (isDev && network.id === props.value)
			),
		[safeChainID, props.value, networksToUse]
	);

	const [isOpen, set_isOpen] = useState(false);
	return (
		<Popover.Root
			open={isOpen}
			onOpenChange={() => {
				set_isOpen(!isOpen);
				plausible(PLAUSIBLE_EVENTS.SWAP_CLICK_NETWORK_DROPDOWN);
			}}>
			<Popover.Trigger asChild>
				<div className={'relative size-full h-20 rounded-lg'}>
					<button
						role={'combobox'}
						aria-expanded={isOpen}
						className={cl(
							'z-20 relative border transition-all',
							'flex justify-center items-center cursor-pointer',
							'focus:placeholder:text-neutral-300 placeholder:transition-colors',
							'aspect-square bg-neutral-0 rounded-lg border-neutral-400 size-full',
							'hover:bg-neutral-100 transition-colors hover:border-neutral-600'
						)}>
						<div className={'flex size-10 items-center justify-center'}>
							{isMounted() && currentNetwork?.name ? (
								<ImageWithFallback
									width={40}
									height={40}
									alt={currentNetwork.name}
									className={'size-10'}
									src={`${process.env.SMOL_ASSETS_URL}/chain/${currentNetwork.id}/logo-128.png`}
								/>
							) : (
								<div className={'size-10 rounded-full bg-neutral-400'} />
							)}
						</div>
					</button>
				</div>
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
						{networksToUse.map(network => (
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
									const chain = networksToUse.find(
										network => network.name.toLowerCase() === selectedNetwork.toLocaleLowerCase()
									);
									props.onChange(chain?.id || 1);
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

export function ReadonlyNetworkInputSelector(props: {value: number}): ReactElement {
	const isMounted = useIsMounted();
	const safeChainID = toSafeChainID(props.value, Number(process.env.BASE_CHAINID));

	/**********************************************************************************************
	 ** currentNetwork returns the current network object from the list of networks to use. We will
	 ** use the safeChainID or the value provided by the user if we are in development mode.
	 *********************************************************************************************/
	const currentNetwork = useMemo(() => {
		const allNetworks = [...supportedNetworks, ...supportedTestNetworks, localhost];
		return allNetworks.find(
			(network): boolean => network.id === safeChainID || (isDev && network.id === props.value)
		);
	}, [safeChainID, props.value]);

	return (
		<div className={'relative size-full h-20 rounded-lg'}>
			<div
				className={cl(
					'z-20 relative border transition-all',
					'flex justify-center items-center',
					'aspect-square bg-neutral-0 rounded-lg border-neutral-400 size-full'
				)}>
				<div className={'flex size-10 items-center justify-center'}>
					{isMounted() && currentNetwork?.name ? (
						<ImageWithFallback
							width={40}
							height={40}
							alt={currentNetwork.name}
							className={'size-10'}
							src={`${process.env.SMOL_ASSETS_URL}/chain/${currentNetwork.id}/logo-128.png`}
						/>
					) : (
						<div className={'size-10 rounded-full bg-neutral-400'} />
					)}
				</div>
			</div>
		</div>
	);
}
