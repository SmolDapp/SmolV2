import React, {useCallback, useMemo, useState} from 'react';
import toast from 'react-hot-toast';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {formatAmount, formatTAmount, toAddress, toBigInt, toNormalizedBN, truncateHex} from '@builtbymom/web3/utils';
import {approveERC20, defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {Button} from '@lib/primitives/Button';
import {isDev} from '@lib/utils/tools.chains';
import {isUnlimitedBN} from '@lib/utils/tools.revoke';

import {useAllowances} from './useAllowances';

import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TAllowanceItemProps, TTokenAllowance} from '@lib/types/Revoke';

export const AllowanceItem = ({allowance, price}: TAllowanceItemProps): ReactElement => {
	const {dispatchConfiguration} = useAllowances();
	const [revokeStatus, set_revokeStatus] = useState(defaultTxStatus);
	const {provider} = useWeb3();
	const {chainID, safeChainID} = useChainID();

	/**********************************************************************************************
	 ** This function calls approve contract and sets 0 for approve amount. Simply it revokes the
	 ** allowance.
	 *********************************************************************************************/
	const revokeTokenAllowance = useCallback(
		async (tokenToRevoke: TTokenAllowance, spender: TAddress): Promise<void> => {
			if (!tokenToRevoke) {
				return;
			}
			dispatchConfiguration({type: 'SET_ALLOWANCE_TO_REVOKE', payload: {...tokenToRevoke, spender}});
			await approveERC20({
				contractAddress: tokenToRevoke.address,
				chainID: isDev ? chainID : safeChainID,
				connector: provider,
				spenderAddress: spender,
				amount: 0n,
				statusHandler: set_revokeStatus
			});
		},
		[chainID, dispatchConfiguration, provider, safeChainID]
	);
	/**********************************************************************************************
	 ** We want to show amount of allowance with correct decimal or 'Unlimited'.
	 *********************************************************************************************/
	const allowanceAmount = useMemo(() => {
		if (isUnlimitedBN(allowance.args.value as bigint)) {
			return 'Unlimited';
		}

		const value = toNormalizedBN(allowance.args.value as bigint, allowance.decimals).normalized;
		return formatTAmount({value, decimals: allowance.decimals});
	}, [allowance]);

	/**********************************************************************************************
	 ** The tokenAmountInUSD memoized value contains the string representation of the token amount
	 ** in USD. If the token balance is zero, it will display 'N/A'.
	 *********************************************************************************************/
	const tokenAmountInUSD = useMemo(() => {
		if (!allowance) {
			return 'N/A';
		}
		if (toBigInt(price?.raw) === 0n) {
			return 'N/A';
		}

		if (allowanceAmount === 'Unlimited') {
			return 'unlimited';
		}
		const value =
			allowanceAmount !== 'Unlimited'
				? toNormalizedBN(allowance.args.value as bigint, allowance.decimals).normalized *
					(price?.normalized || 0)
				: 0;
		const formatedValue = formatAmount(value, 2);
		return `$${formatedValue}`;
	}, [allowance, allowanceAmount, price]);

	/**********************************************************************************************
	 ** This function calls revoke function and lets us to revoke the allowance.
	 *********************************************************************************************/
	const onRevoke = useCallback(() => {
		revokeTokenAllowance({address: allowance.address, name: allowance.symbol ?? ''}, allowance.args.sender);
	}, [allowance.address, allowance.args.sender, allowance.symbol, revokeTokenAllowance]);

	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** This function lets us to copy the address to the clipboard and show the info toast.
	 *********************************************************************************************/
	const onCopyAddress = useCallback((e: React.MouseEvent<HTMLButtonElement>, address: TAddress) => {
		e.stopPropagation();
		navigator.clipboard.writeText(toAddress(address));
		toast.success(`Address copied to clipboard: ${toAddress(address)}`);
	}, []);

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
		<>
			<tr className={'rounded-lg border border-neutral-400 p-4 md:hidden'}>
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
					<div className={'mt-1  flex w-full items-center justify-between'}>
						<p className={'text-sm text-neutral-600'}>{'Value:'}</p>
						<p className={'text-sm text-neutral-600'}>{tokenAmountInUSD}</p>
					</div>
					<div className={'mt-1 flex w-full items-center justify-between'}>
						<p className={'text-sm text-neutral-600'}>{'Spender:'}</p>
						<p className={'text-sm text-neutral-600'}>{truncateHex(allowance.args.sender, 5)}</p>
					</div>
					<Button
						onClick={onRevoke}
						isBusy={revokeStatus.pending}
						className={'mt-4 !h-8 w-full text-sm font-bold'}>
						{'Revoke'}
					</Button>
				</div>
			</tr>

			<tr className={'hidden md:table-row'}>
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
					<div className={'flex w-full flex-col items-end justify-end'}>
						<p className={'h-full truncate text-right text-base leading-6'}>{allowanceAmount}</p>
						<p className={'text-xs text-neutral-600'}>{tokenAmountInUSD}</p>
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
						isBusy={revokeStatus.pending}
						className={'!h-8 w-[85px] font-bold'}>
						<p className={' text-xs font-bold leading-6'}>{'Revoke'}</p>
					</Button>
				</td>
			</tr>
		</>
	);
};
