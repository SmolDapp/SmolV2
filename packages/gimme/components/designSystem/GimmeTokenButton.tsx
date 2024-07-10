import {type ReactElement, useMemo} from 'react';
import {useTokenList} from '@builtbymom/web3/contexts/WithTokenList';
import {cl, formatAmount, isAddress, toBigInt, truncateHex} from '@builtbymom/web3/utils';
import {ImageWithFallback} from '@lib/common/ImageWithFallback';
import {IconChevron} from '@lib/icons/IconChevron';
import {IconWallet} from '@lib/icons/IconWallet';

import type {TNormalizedBN, TToken} from '@builtbymom/web3/types';

export function GimmeTokenButton(props: {
	token: TToken | undefined;
	isDisabled?: boolean;
	displayChevron?: boolean;
	onClick?: () => void;
	price?: TNormalizedBN;

	className?: string;
}): ReactElement {
	const {getToken} = useTokenList();

	/**********************************************************************************************
	 ** The tokenIcon memoized value contains the URL of the token icon. Based on the provided
	 ** information and what we have in the token list, we will try to find the correct icon source
	 *********************************************************************************************/
	const tokenIcon = useMemo(() => {
		if (!props.token) {
			return '/placeholder.png';
		}
		if (props.token?.logoURI) {
			return props.token.logoURI;
		}
		const tokenFromList = getToken({chainID: props.token.chainID, address: props.token.address});
		if (tokenFromList?.logoURI) {
			return tokenFromList.logoURI;
		}
		return `${process.env.SMOL_ASSETS_URL}/token/${props.token.chainID}/${props.token.address}/logo-32.png`;
	}, [getToken, props.token]);

	/**********************************************************************************************
	 ** The tokenBalance memoized value contains the string representation of the token balance,
	 ** correctly formated. If the balance is dusty, it will display '> 0.000001' instead of '0'.
	 *********************************************************************************************/
	const tokenBalance = useMemo(() => {
		if (!props.token) {
			return '';
		}
		const formatedBalance = formatAmount(props.token.balance.normalized, 0, 6);
		if (Number(formatedBalance) < 0) {
			return '< 0.000001';
		}
		if (Number(formatedBalance) === 0) {
			return '0.00';
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
				'flex flex-row gap-2 items-center justify-between rounded-lg py-4 w-full h-full cursor-default',
				'disabled:cursor-not-allowed',
				'bg-white hover:bg-grey-100 disabled:opacity-20',
				props.onClick && 'px-4 transition-colors cursor-pointer',
				props.className
			)}
			disabled={props.isDisabled}>
			<div className={cl('flex w-full justify-between')}>
				<div className={cl('flex w-full justify-between gap-2 items-center')}>
					{props.token && isAddress(props.token.address) ? (
						<ImageWithFallback
							alt={props.token.symbol}
							unoptimized
							src={tokenIcon}
							altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.token.chainID}/${props.token.address}/logo-32.png`}
							quality={90}
							width={32}
							height={32}
						/>
					) : (
						<div className={'bg-neutral-0 flex size-8 items-center justify-center rounded-full'}>
							<IconWallet className={'size-4 text-neutral-600'} />
						</div>
					)}

					<div className={'w-full max-w-[400px] text-left'}>
						<p
							className={cl(
								'whitespace-normal',
								isAddress(props.token?.address) ? 'font-bold' : 'text-neutral-600 text-sm font-normal'
							)}>
							{props.token?.symbol || 'Select token'}
						</p>
						{!!props.token?.address && (
							<p className={cl('text-xs', 'text-grey-700')}>{truncateHex(props.token.address, 5)}</p>
						)}
					</div>
					{props.token && (
						<div className={'size-full whitespace-nowrap text-right'}>
							<b className={'text-left text-base'}>{tokenBalance}</b>

							<p className={cl('text-xs', 'text-grey-700')}>&nbsp;{balanceValue}</p>
						</div>
					)}
				</div>
			</div>
			{props.displayChevron && <IconChevron className={'size-4 min-w-4 text-neutral-600'} />}
		</button>
	);
}
