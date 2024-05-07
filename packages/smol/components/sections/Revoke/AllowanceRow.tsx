import {useMemo} from 'react';
import {toast} from 'react-hot-toast';
import {ImageWithFallback} from 'packages/lib/common/ImageWithFallback';
import {IconCopy} from 'packages/lib/icons/IconCopy';
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
		<tr
			className={'border-separate rounded-md border border-neutral-400'}
			key={transactionHash}>
			<td className={'p-6'}>
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
						<div className={'font-bold'}>{tokenSymbol}</div>

						<button
							className={
								'z-10 flex w-full cursor-copy items-center justify-end text-sm font-light text-neutral-600'
							}
							onClick={e => {
								e.stopPropagation();
								navigator.clipboard.writeText(toAddress(args.sender));
								toast.success(`Address copied to clipboard: ${toAddress(allowance.address)}`);
							}}>
							<p className={'mb-[-2px] mr-1 hover:underline'}> {truncateHex(allowance.address, 5)}</p>
							<IconCopy className={'size-4 font-bold'} />
						</button>
					</div>
				</div>
			</td>
			<td className={'p-y-6  max-w-[120px] truncate'}>
				<p className={'flex items-center justify-end text-base leading-6'}>{allowanceAmount}</p>
			</td>
			<td className={'max-w-32 p-6 '}>
				<div className={'flex flex-col text-right'}>
					<div className={'font-bold'}>{tokenName}</div>
					<div className={'flex items-center justify-end text-sm font-light text-neutral-600'}>
						<div className={'grid w-full'}>
							<button
								className={
									'z-10 flex w-full cursor-copy items-center justify-end text-sm font-light text-neutral-600'
								}
								onClick={e => {
									e.stopPropagation();
									navigator.clipboard.writeText(toAddress(args.sender));
									toast.success(`Address copied to clipboard: ${toAddress(args.sender)}`);
								}}>
								<p className={'mb-[-2px] mr-1 hover:underline'}> {truncateHex(args.sender, 5)}</p>
								<IconCopy className={'size-4 font-bold'} />
							</button>
						</div>
					</div>
				</div>
			</td>
			<td className={'w-32 p-3'}>
				<Button
					onClick={() => revoke({address: allowance.address, name: tokenSymbol ?? ''}, allowance.args.sender)}
					className={'!h-8 font-bold'}>
					<p className={'text-xs font-bold leading-6'}>{'Revoke'}</p>
				</Button>
			</td>
		</tr>
	);
};
