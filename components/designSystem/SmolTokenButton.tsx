import {type ReactElement, useMemo} from 'react';
import {cl, formatAmount, isAddress, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import {IconChevron} from '@icons/IconChevron';
import {IconWallet} from '@icons/IconWallet';
import {ImageWithFallback} from '@common/ImageWithFallback';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

export function SmolTokenButton(props: {
	token: TToken | undefined;
	isDisabled?: boolean;
	displayChevron?: boolean;
	onClick?: () => void;
	price?: TNormalizedBN;
}): ReactElement {
	/**********************************************************************************************
	 ** The tokenBalance memoized value contains the string representation of the token balance,
	 ** correctly formated. If the balance is dusty, it will display '> 0.000001' instead of '0'.
	 *********************************************************************************************/
	const tokenBalance = useMemo(() => {
		if (!props.token) {
			return '';
		}
		const formatedBalance = formatAmount(props.token.balance.normalized, 0, 6);
		if (Number(formatedBalance) <= 0) {
			return '< 0.000001';
		}
		return formatedBalance;
	}, [props.token]);

	/**********************************************************************************************
	 ** The balanceValue memoized value contains the string representation of the token balance,
	 ** in USD. If the token balance is zero, it will display 'N/A'.
	 *********************************************************************************************/
	const balanceValue = useMemo(() => {
		if (!props.token) {
			return 'N/A';
		}
		if (toBigInt(props.price?.raw) === 0n) {
			return 'N/A';
		}
		const value = props.token.balance.normalized * (props.price?.normalized || 0);

		const formatedValue = formatAmount(value, 2);
		return `$${formatedValue}`;
	}, [props.token, props.price]);

	return (
		<button
			onClick={props.onClick}
			className={cl(
				'flex flex-row gap-2 items-center justify-between rounded-[4px] py-4 w-full h-full cursor-default',
				'disabled:cursor-not-allowed disabled:hover:bg-neutral-200 disabled:opacity-20',
				props.onClick && 'px-4 bg-neutral-200 hover:bg-neutral-300 transition-colors cursor-pointer'
			)}
			disabled={props.isDisabled}>
			<div className={'flex w-full items-center justify-between'}>
				<div className={'flex items-center gap-2'}>
					{props.token && isAddress(props.token.address) ? (
						<ImageWithFallback
							alt={props.token.symbol}
							unoptimized
							src={
								props.token?.logoURI ||
								`${process.env.SMOL_ASSETS_URL}/token/${props.token.chainID}/${props.token.address}/logo-32.png`
							}
							altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.token.chainID}/${props.token.address}/logo-32.png`}
							quality={90}
							width={32}
							height={32}
						/>
					) : (
						<div className={'flex size-8 items-center justify-center rounded-full bg-neutral-0'}>
							<IconWallet className={'size-4 text-neutral-600'} />
						</div>
					)}

					<div className={'text-left'}>
						<p
							className={cl(
								'truncate',
								isAddress(props.token?.address) ? 'font-bold' : 'text-neutral-600 text-sm font-normal'
							)}>
							{props.token?.symbol || 'Select token'}
						</p>
						{!!props.token?.address && (
							<p className={'text-xs text-neutral-600'}>{truncateHex(props.token.address, 5)}</p>
						)}
					</div>
				</div>
				{props.token && (
					<div className={'text-right'}>
						<b className={'text-left text-base'}>{tokenBalance}</b>

						<p className={'text-xs text-neutral-600'}>&nbsp;{balanceValue}</p>
					</div>
				)}
			</div>
			{props.displayChevron && <IconChevron className={'size-4 min-w-4 text-neutral-600'} />}
		</button>
	);
}
