'use client';

import {IconChevron} from '@lib/icons/IconChevron';
import {IconWallet} from '@lib/icons/IconWallet';
import {cl} from '@lib/utils/helpers';
import {isAddress} from 'lib/utils/tools.addresses';
import {useMemo} from 'react';

import {useBalancesCurtain} from '@smolContexts/useBalancesCurtain';
import {useTokenList} from '@smolContexts/WithTokenList';
import {ImageWithFallback} from 'packages/smol/common/ImageWithFallback';

import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {ReactElement} from 'react';

export function SmolTokenSelectorButton(props: {
	onSelectToken: (token: TERC20TokensWithBalance) => void;
	token: TERC20TokensWithBalance | undefined;
	chainID?: number;
	shouldUseCurtainWithTabs?: boolean;
	displayNetworkIcon?: boolean;
}): ReactElement {
	const {onOpenCurtain} = useBalancesCurtain();
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

	return (
		<button
			onClick={() =>
				onOpenCurtain(token => props.onSelectToken(token), {
					chainID: props.chainID,
					withTabs: props.shouldUseCurtainWithTabs
				})
			}
			className={cl(
				'flex items-center justify-between gap-2 rounded-[4px] py-4 pl-4 pr-2 w-full transition-colors',
				'bg-neutral-200 hover:bg-neutral-300'
			)}>
			<div className={'flex w-full items-center gap-2'}>
				<div className={'realtive bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
					{props.token && isAddress(props.token.address) ? (
						<div className={'relative'}>
							{props.displayNetworkIcon && (
								<div className={'absolute -left-1 -top-1'}>
									<ImageWithFallback
										width={16}
										height={16}
										alt={props.token.chainID.toString()}
										src={`${process.env.SMOL_ASSETS_URL}/chain/${props.token.chainID}/logo-32.png`}
									/>
								</div>
							)}
							<ImageWithFallback
								alt={props.token.symbol}
								unoptimized
								src={tokenIcon}
								altSrc={`${process.env.SMOL_ASSETS_URL}/token/${props.token.chainID}/${props.token.address}/logo-128.png`}
								quality={90}
								width={32}
								height={32}
							/>
						</div>
					) : (
						<IconWallet className={'size-4 text-neutral-600'} />
					)}
				</div>
				<p
					className={cl(
						'truncate max-w-[88px]',
						isAddress(props.token?.address) && (props.token?.symbol || props.token?.name)
							? 'font-bold'
							: 'text-neutral-600 text-sm font-normal'
					)}>
					{props.token?.symbol || props.token?.name || 'Select Token'}
				</p>
			</div>

			<IconChevron className={cl('size-4 min-w-4 text-neutral-600')} />
		</button>
	);
}
