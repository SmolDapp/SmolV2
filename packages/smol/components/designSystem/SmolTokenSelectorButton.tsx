import {ImageWithFallback} from 'lib/common/ImageWithFallback';
import {IconChevron} from 'lib/icons/IconChevron';
import {IconWallet} from 'lib/icons/IconWallet';
import {cl, isAddress} from '@builtbymom/web3/utils';
import {useBalancesCurtain} from '@smolContexts/useBalancesCurtain';

import type {TToken} from '@builtbymom/web3/types';

export function SmolTokenSelectorButton(props: {
	onSelectToken: (token: TToken) => void;
	token: TToken | undefined;
	chainID?: number;
	shouldUseCurtainWithTabs?: boolean;
}): JSX.Element {
	const {onOpenCurtain} = useBalancesCurtain();

	return (
		<button
			onClick={() =>
				onOpenCurtain(token => props.onSelectToken(token), {
					chainID: props.chainID,
					withTabs: props.shouldUseCurtainWithTabs
				})
			}
			className={cl(
				'flex items-center justify-between gap-2 rounded-[4px] py-4 pl-4 pr-2 w-full',
				'bg-neutral-200 hover:bg-neutral-300 transition-colors'
			)}>
			<div className={'flex w-full items-center gap-2'}>
				<div className={'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
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

			<IconChevron className={'size-4 min-w-4 text-neutral-600'} />
		</button>
	);
}
