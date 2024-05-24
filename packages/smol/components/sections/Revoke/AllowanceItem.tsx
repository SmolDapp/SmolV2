import {type ReactElement, useCallback, useMemo} from 'react';
import React from 'react';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {toNormalizedBN, truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {Button} from '@lib/primitives/Button';
import {isUnlimited} from '@lib/utils/tools.revoke';

import type {TAllowanceItemProps} from '@lib/types/Revoke';

export const AllowanceItem = ({allowance, revoke}: TAllowanceItemProps): ReactElement => {
	const allowanceAmount = useMemo(() => {
		if (isUnlimited(allowance.args.value as bigint)) {
			return 'Unlimited';
		}
		return toNormalizedBN(allowance.args.value as bigint, allowance.decimals).normalized;
	}, [allowance]);

	const onRevoke = useCallback(() => {
		revoke({address: allowance.address, name: allowance.symbol ?? ''}, allowance.args.sender);
	}, [allowance.address, allowance.args.sender, allowance.symbol, revoke]);

	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** The tokenIcon memoized value contains the URL of the token icon. Based on the provided
	 ** information and what we have in the token list, we will try to find the correct icon source
	 *********************************************************************************************/
	const tokenIcon = useMemo(() => {
		if (!allowance) {
			return '/placeholder.png';
		}
		const tokenFromList = getToken({chainID: allowance.chainID, address: allowance.address});
		if (tokenFromList?.logoURI) {
			return tokenFromList.logoURI;
		}
		return `${process.env.SMOL_ASSETS_URL}/token/${allowance.chainID}/${allowance.address}/logo-32.png`;
	}, [allowance, getToken]);

	return (
		<div className={'rounded-lg border border-neutral-400 p-4'}>
			<div className={'flex'}>
				<div className={'flex'}>
					<div>
						<ImageWithFallback
							alt={allowance.symbol ?? ''}
							unoptimized
							src={tokenIcon}
							quality={90}
							width={40}
							height={40}
						/>
					</div>
					<div className={'ml-4 flex flex-col'}>
						<div className={'text-base font-bold'}>{allowance.symbol}</div>

						<p className={'mb-[-2px] mr-1 text-xs hover:underline'}>{truncateHex(allowance.address, 5)}</p>
					</div>
				</div>
			</div>
			<div className={'mt-2 border-b border-neutral-300'}></div>
			<div className={'mt-2.5'}>
				<div className={'mt-1 flex w-full items-center justify-between'}>
					<p className={'text-sm text-neutral-600'}>{'Amount:'}</p>
					<p>{allowanceAmount}</p>
				</div>

				<div className={'mt-1 flex w-full items-center justify-between'}>
					<p className={'text-sm text-neutral-600'}>{'Spender:'}</p>
					<p className={'text-sm text-neutral-600'}>{truncateHex(allowance.args.sender, 5)}</p>
				</div>
				<Button
					onClick={onRevoke}
					className={'mt-4 !h-8 w-full text-sm font-bold'}>
					{'Revoke'}
				</Button>
			</div>
		</div>
	);
};
