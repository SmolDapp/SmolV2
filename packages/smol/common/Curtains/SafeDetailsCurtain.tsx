import {CurtainContent} from '@lib/primitives/Curtain';
import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';

import {AddressEntry} from 'packages/smol/common/AddressBookEntry';
import {CloseCurtainButton} from 'packages/smol/common/Curtains/InfoCurtain';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {ReactElement} from 'react';

type TSafeDetailsCurtainArgs = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	address: TAddress;
	owners: TAddress[];
	threshold: number;
	seed: bigint;
};

export function SafeDetailsCurtain(props: TSafeDetailsCurtainArgs): ReactElement {
	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Safe Details'}</h3>
						<CloseCurtainButton />
					</div>
					<p className={'text-xs text-neutral-600'}>
						{
							'You can view the details of the safe, including the address, owners, threshold and seed used to create the safe.'
						}
					</p>
					<div className={'mt-4 h-px w-full bg-neutral-300'} />
					<div className={'flex h-full flex-col gap-4'}>
						<div className={'scrollable mb-8 flex flex-col pb-2'}>
							<div>
								<small className={'mb-1 mt-4'}>{'Safe Address'}</small>
								<div>
									<AddressEntry address={props.address} />
								</div>
							</div>

							<div>
								<small className={'mb-1 mt-4'}>{'Owners'}</small>
								<div>
									{props.owners.map(owner => (
										<AddressEntry
											key={owner}
											address={owner}
										/>
									))}
								</div>
							</div>

							<div>
								<small className={'mb-1 mt-4'}>{'Threshold'}</small>
								<p className={'text-sm'}>
									<b className={'font-medium'}>{props.threshold}</b>
									<span className={'text-neutral-600'}>{` / ${props.owners.length}`}</span>
								</p>
							</div>

							<div>
								<small className={'mb-1 mt-4'}>{'Seed'}</small>
								<p className={'whitespace-break-spaces break-all text-sm'}>{props.seed.toString()}</p>
							</div>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
