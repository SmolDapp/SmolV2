import {type ReactElement, useMemo} from 'react';
import React from 'react';
import {truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {Button} from '@lib/primitives/Button';
import {getTokenAmount, isUnlimited} from '@lib/utils/tools.revoke';

import type {TAddress} from '@builtbymom/web3/types';
import type {TExpandedAllowance, TTokenAllowance} from '@lib/types/Revoke';

type TAllowanceItemProps = {
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
	allowance: TExpandedAllowance;
};

export const AllowanceItem = ({allowance, revoke}: TAllowanceItemProps): ReactElement => {
	const valueAtRisk = null;
	const allowanceAmount = useMemo(() => {
		if (isUnlimited(allowance.args.value as bigint)) {
			return 'Unlimited';
		}
		return getTokenAmount(allowance.decimals, allowance.args.value as bigint);
	}, [allowance]);
	return (
		<React.Fragment key={`${allowance.blockNumber} + ${allowance.logIndex}`}>
			<div className={'rounded-lg border border-neutral-400 p-4'}>
				<div className={'flex'}>
					<div className={'flex'}>
						<div>
							<ImageWithFallback
								alt={allowance.symbol ?? ''}
								unoptimized
								src={`${process.env.SMOL_ASSETS_URL}/token/${allowance.chainID}/${allowance.address}/logo-32.png`}
								altSrc={`${process.env.SMOL_ASSETS_URL}/token/${allowance.chainID}/${allowance.address}/logo-32.png`}
								quality={90}
								width={40}
								height={40}
							/>
						</div>
						<div className={'ml-4 flex flex-col'}>
							<div className={'text-base font-bold'}>{allowance.symbol}</div>

							<p className={'mb-[-2px] mr-1 text-xs hover:underline'}>
								{truncateHex(allowance.address, 5)}
							</p>
						</div>
					</div>
				</div>
				<div className={'mt-2 border-b border-neutral-300'}></div>
				<div className={'mt-2.5'}>
					<div className={'mt-1 flex w-full items-center justify-between'}>
						<p className={'text-sm text-neutral-600'}>{'Amount:'}</p>
						<p>{allowanceAmount}</p>
					</div>
					{valueAtRisk ? (
						<div className={'mt-1 flex w-full items-center justify-between'}>
							<p className={'text-sm text-neutral-600'}>{'Value:'}</p>
							<p>{allowance.args.value}</p>
						</div>
					) : null}
					<div className={'mt-1 flex w-full items-center justify-between'}>
						<p className={'text-sm text-neutral-600'}>{'Spender:'}</p>
						<p className={'text-sm text-neutral-600'}>{truncateHex(allowance.args.sender, 5)}</p>
					</div>
					<Button
						onClick={() =>
							revoke({address: allowance.address, name: allowance.symbol ?? ''}, allowance.args.sender)
						}
						className={'mt-4 !h-8 w-full text-sm font-bold'}>
						{'Revoke'}
					</Button>
				</div>
			</div>
		</React.Fragment>
	);
};
