import {type ReactElement} from 'react';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {formatCounterValue} from '@builtbymom/web3/utils';
import IconChevronPlain from '@lib/icons/IconChevronPlain';

import {VaultRow} from './VaultRow';

function EmptyView(): ReactElement {
	return (
		<div
			className={
				'flex h-[248px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-neutral-600 text-neutral-600'
			}>
			<p>{'Your Portfolio is empty.'}</p>
			<p>{'Select Token at Earn section and add opportunity.'}</p>
		</div>
	);
}

export function Portfolio(): ReactElement {
	const {vaults} = useVaults();
	const isEmpty = false;
	return (
		<div className={'w-full max-w-[848px] rounded-2xl bg-white p-8 shadow-xl'}>
			<div className={'font-medium'}>
				<p className={'mb-2 text-xs'}>{'Total Deposited'}</p>
				<div className={'text-4xl'}>{formatCounterValue(0, 1)}</div>
			</div>
			<div className={'mt-12'}>
				<div className={'mb-4 mr-4 flex items-center justify-between'}>
					<p className={'min-w-[260px] text-xs font-medium'}>{'Your Opportunities'}</p>
					<div className={'flex text-xs text-neutral-600'}>
						<div
							className={
								'flex cursor-pointer items-center justify-end gap-1 transition-colors hover:text-neutral-700'
							}>
							{'APY'}
							<IconChevronPlain />
						</div>
						<div
							className={
								'flex w-full min-w-[106px] cursor-pointer items-center justify-end gap-1 transition-colors hover:text-neutral-700'
							}>
							{'Deposited'}
							<IconChevronPlain />
						</div>
						<div
							className={
								'flex w-full min-w-[90px] cursor-pointer items-center justify-end gap-1 transition-colors hover:text-neutral-700'
							}>
							{'Earned'}
							<IconChevronPlain />
						</div>
						<div className={'flex w-full min-w-[120px] items-center justify-end gap-1 '}>
							{'Withdraw/Deposit'}
						</div>
					</div>
				</div>
				{isEmpty ? <EmptyView /> : vaults[0] && <VaultRow vault={vaults[0]} />}
			</div>
		</div>
	);
}
