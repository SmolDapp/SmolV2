import {ImageWithFallback} from 'lib/common';
import {IconChevron, IconWallet} from 'lib/icons';
import {cl, isAddress} from '@builtbymom/web3/utils';
import {useBalancesCurtain} from '@contexts/useBalancesCurtain';

import type {TToken} from '@builtbymom/web3/types';

export function SmolTokenSelectorButton({
	onSelectToken,
	token
}: {
	onSelectToken: (token: TToken) => void;
	token: TToken | undefined;
}): JSX.Element {
	const {onOpenCurtain} = useBalancesCurtain();

	return (
		<button
			className={cl(
				'flex items-center justify-between gap-2 rounded-[4px] py-4 pl-4 pr-2 w-full',
				'bg-neutral-200 hover:bg-neutral-300 transition-colors'
			)}
			onClick={() =>
				onOpenCurtain(token => {
					onSelectToken(token);
				})
			}>
			<div className={'flex w-full items-center gap-2'}>
				<div className={'bg-neutral-0 flex size-8 min-w-8 items-center justify-center rounded-full'}>
					{token && isAddress(token.address) ? (
						<ImageWithFallback
							alt={token.symbol}
							unoptimized
							src={
								token?.logoURI ||
								`${process.env.SMOL_ASSETS_URL}/token/${token.chainID}/${token.address}/logo-32.png`
							}
							altSrc={`${process.env.SMOL_ASSETS_URL}/token/${token.chainID}/${token.address}/logo-32.png`}
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
						isAddress(token?.address) && (token?.symbol || token?.name)
							? 'font-bold'
							: 'text-neutral-600 text-sm font-normal'
					)}>
					{token?.symbol || token?.name || 'Select Token'}
				</p>
			</div>

			<IconChevron className={'size-4 min-w-4 text-neutral-600'} />
		</button>
	);
}
