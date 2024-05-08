import {useMemo} from 'react';
import {toast} from 'react-hot-toast';
import {ImageWithFallback} from 'packages/lib/common/ImageWithFallback';
import {Button} from 'packages/lib/primitives/Button';
import {getTokenAmount} from 'packages/lib/utils/tools.revoke';
import {useChainID} from '@builtbymom/web3/hooks/useChainID';
import {parseUnits, toAddress, truncateHex} from '@builtbymom/web3/utils';

import {useGetTokenInfo} from './useGetTokenInfo';

import type {TAllowance} from 'packages/lib/utils/types/revokeType';
import type {ReactElement} from 'react';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAllowance} from './useAllowances';

type TAllowanceRowProps = {
	allowance: TAllowance;
	revoke: (tokenToRevoke: TTokenAllowance, spender: TAddress) => void;
};

export const AllowanceRow = ({allowance, revoke}: TAllowanceRowProps): ReactElement => {
	const {args, transactionHash} = allowance;
	const {tokenDecimals, tokenSymbol} = useGetTokenInfo(allowance.address);
	const {tokenName} = useGetTokenInfo(args.sender);

	const allowanceAmount = useMemo(() => {
		if ((allowance.args.value as bigint) > parseUnits('115', 74)) {
			return 'Unlimited';
		}
		return getTokenAmount(tokenDecimals, allowance.args.value as bigint);
	}, [tokenDecimals, allowance]);

	const {safeChainID} = useChainID();

	return (
		<tr key={transactionHash}>
			<td className={'rounded-l-lg border-y border-l border-neutral-400 p-6'}>
				<div className={'flex'}>
					<div>
						<ImageWithFallback
							alt={tokenSymbol ?? ''}
							unoptimized
							src={`${process.env.SMOL_ASSETS_URL}/token/${safeChainID}/${allowance.address}/logo-32.png`}
							altSrc={`${process.env.SMOL_ASSETS_URL}/token/${safeChainID}/${allowance.address}/logo-32.png`}
							quality={90}
							width={40}
							height={40}
						/>
					</div>
					<div className={'ml-4 flex flex-col'}>
						<div className={'text-base font-bold'}>{tokenSymbol}</div>

						<button
							className={
								'z-10 flex w-full cursor-copy items-center justify-end font-light text-neutral-600'
							}
							onClick={e => {
								e.stopPropagation();
								navigator.clipboard.writeText(toAddress(args.sender));
								toast.success(`Address copied to clipboard: ${toAddress(allowance.address)}`);
							}}>
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
					<div className={'flex max-w-[170px] justify-end'}>
						<p className={'truncate text-base font-light text-neutral-900'}>{tokenName}</p>
					</div>
					<div className={'flex items-center justify-end font-light text-neutral-600'}>
						<div className={'grid w-full'}>
							<button
								className={
									'z-10 flex w-full cursor-copy items-center justify-end font-light text-neutral-600'
								}
								onClick={e => {
									e.stopPropagation();
									navigator.clipboard.writeText(toAddress(args.sender));
									toast.success(`Address copied to clipboard: ${toAddress(args.sender)}`);
								}}>
								<p className={'mb-[-2px] text-xs hover:underline'}> {truncateHex(args.sender, 5)}</p>
							</button>
						</div>
					</div>
				</div>
			</td>
			<td className={'w-32 rounded-r-lg border-y border-r border-neutral-400 p-3'}>
				<Button
					onClick={() => revoke({address: allowance.address, name: tokenSymbol ?? ''}, allowance.args.sender)}
					className={'!h-8 font-bold'}>
					<p className={'text-xs font-bold leading-6'}>{'Revoke'}</p>
				</Button>
			</td>
		</tr>
	);
};
