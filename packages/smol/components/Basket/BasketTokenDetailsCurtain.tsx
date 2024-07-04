import React from 'react';
import {cl} from '@builtbymom/web3/utils';
import * as Dialog from '@radix-ui/react-dialog';
import {Counter} from '@lib/common/Counter';
import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import {SmolTokenButton} from '@lib/common/SmolTokenButton';
import {CurtainContent} from '@lib/primitives/Curtain';

import type {ReactElement} from 'react';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TBasketToken} from './SwapBasket';

type TBasketTokenDetailsCurtainArgs = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	item: TBasketToken;
	fromToken: TTokenAmountInputElement;
};

export function BasketTokenDetailsCurtain(props: TBasketTokenDetailsCurtainArgs): ReactElement {
	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Details'}</h3>
						<CloseCurtainButton />
					</div>
					<div className={'grid gap-4'}>
						<p className={'text-xs text-neutral-600'}>
							{
								'You can view the details of the safe, including the address, owners, threshold and seed used to create the safe.'
							}
						</p>
						<div
							className={cl(
								'flex h-[72px] w-full flex-row items-center justify-between',
								'gap-2 rounded-[4px] bg-neutral-200 p-4'
							)}>
							<SmolTokenButton
								token={props.item.token}
								isDisabled={false}
							/>
						</div>
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<div className={'scrollable mb-8 flex flex-col pb-2'}>
							<div>
								<small className={'mb-1 mt-4'}>{'Minimum amount to receive'}</small>
								<div>
									<Counter
										value={props.item.normalizedBigAmount.normalized}
										decimals={props.item.token.decimals}
										decimalsToDisplay={[6, 12]}
									/>
									{` ${props.item.token.symbol}`}
								</div>
							</div>
							<div>
								<small className={'mb-1 mt-4'}>{'Share of basket'}</small>
								<div>{`${props.item.share}%`}</div>
							</div>

							<div>
								<small className={'mb-1 mt-4'}>{'Swap provider'}</small>
								<div>{props.item.swapSource || 'unknown'}</div>
							</div>

							<div>
								<small className={'mb-1 mt-4'}>{'Fee from swap provider'}</small>
								<div>
									<Counter
										value={
											props.fromToken.normalizedBigAmount.normalized /
												(1 - (props.item?.feeAmount || 0) / 1000000) -
											props.fromToken.normalizedBigAmount.normalized
										}
										decimals={props.fromToken.token?.decimals || 18}
										decimalsToDisplay={[6, 12]}
									/>
									{` ${props.fromToken.token?.symbol || ''}`}
									<span className={'text-sm text-neutral-600'}>
										{` (${(props.item?.feeAmount || 0) / 10000}%)`}
									</span>
								</div>
							</div>
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
