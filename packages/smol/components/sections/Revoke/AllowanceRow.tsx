import {useCallback, useMemo} from 'react';
import {toast} from 'react-hot-toast';
import {ImageWithFallback} from 'packages/lib/common/ImageWithFallback';
import {Button} from 'packages/lib/primitives/Button';
import {isUnlimited} from 'packages/lib/utils/tools.revoke';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {toAddress, toNormalizedBN, truncateHex} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TAllowanceItemProps} from '@lib/types/Revoke';

export const AllowanceRow = ({allowance, revoke}: TAllowanceItemProps): ReactElement => {
	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** We want to show amount of allowance with correct decimal or 'Unlimited'.
	 *********************************************************************************************/
	const allowanceAmount = useMemo(() => {
		if (isUnlimited(allowance.args.value as bigint)) {
			return 'Unlimited';
		}
		return toNormalizedBN(allowance.args.value as bigint, allowance.decimals).normalized;
	}, [allowance]);

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

	/**********************************************************************************************
	 ** This function lets us to copy the address to the clipboard and show the info toast.
	 *********************************************************************************************/
	const onCopyAddress = useCallback((e: React.MouseEvent<HTMLButtonElement>, address: TAddress) => {
		e.stopPropagation();
		navigator.clipboard.writeText(toAddress(address));
		toast.success(`Address copied to clipboard: ${toAddress(address)}`);
	}, []);

	/**********************************************************************************************
	 ** This function calls revoke function and lets us to revoke the allowance.
	 *********************************************************************************************/
	const onRevoke = useCallback(() => {
		revoke({address: allowance.address, name: allowance.symbol ?? ''}, allowance.args.sender);
	}, [allowance.address, allowance.args.sender, allowance.symbol, revoke]);

	return (
		<tr>
			<td className={'rounded-l-lg border-y border-l border-neutral-400 p-6'}>
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

						<button
							className={
								'z-10 flex w-full cursor-copy items-center justify-end font-light text-neutral-600'
							}
							onClick={e => onCopyAddress(e, allowance.address)}>
							<p className={'mb-[-2px] mr-1 text-xs hover:underline'}>
								{truncateHex(allowance.address, 5)}
							</p>
						</button>
					</div>
				</div>
			</td>
			<td className={'p-y-6 max-w-[80px] border-y border-neutral-400'}>
				<div className={'flex w-full justify-end'}>
					<p className={'h-full truncate text-right text-base leading-6'}>{allowanceAmount}</p>
				</div>
			</td>
			<td className={'max-w-32 border-y border-neutral-400 p-6'}>
				<div className={'flex flex-col text-right'}>
					<div className={'flex items-center justify-end font-light text-neutral-600'}>
						<div className={'grid w-full'}>
							<button
								className={
									'z-10 flex w-full cursor-copy items-center justify-end font-light text-neutral-600'
								}
								onClick={e => onCopyAddress(e, allowance.args.sender)}>
								<p className={'mb-[-2px] text-xs hover:underline'}>
									{truncateHex(allowance.args.sender, 5)}
								</p>
							</button>
						</div>
					</div>
				</div>
			</td>
			<td className={'w-32 rounded-r-lg border-y border-r border-neutral-400 p-3'}>
				<Button
					onClick={onRevoke}
					className={'!h-8 font-bold'}>
					<p className={'text-xs font-bold leading-6'}>{'Revoke'}</p>
				</Button>
			</td>
		</tr>
	);
};
