import {type ReactElement, useCallback, useEffect, useRef} from 'react';
import {useRouter} from 'next/router';
import {useSolver} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {useCurrentChain} from 'packages/gimme/hooks/useCurrentChain';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {isAddress, isZeroAddress} from '@builtbymom/web3/utils';
import {GimmeTokenAmountInput} from '@gimmeDesignSystem/GimmeTokenAmountInput';
import {IconArrow} from '@gimmeDesignSystem/IconArrow';
import {SelectOpportunityButton} from '@gimmmeSections/Earn/SelectVaultButton';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {EarnWizard} from './EarnWizard';
import {useEarnFlow} from './useEarnFlow';

import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function Earn(): ReactElement {
	const router = useRouter();
	const {getToken} = useWallet();
	const {userVaults, vaults} = useVaults();
	const {configuration, dispatchConfiguration} = useEarnFlow();
	const uniqueIdentifier = useRef<string | undefined>(undefined);
	const {quote, isFetchingQuote} = useSolver();
	const {isZapNeeded} = useIsZapNeeded(configuration);
	const chain = useCurrentChain();

	const isWithdrawing =
		configuration.asset.token && !!vaults[configuration.asset.token?.address] && !configuration.opportunity;

	const onSetAsset = useCallback(
		(value: Partial<TTokenAmountInputElement>): void => {
			dispatchConfiguration({type: 'SET_ASSET', payload: value});
		},
		[dispatchConfiguration]
	);

	const onSetOpportunity = useCallback(
		(value: TYDaemonVault | undefined): void => {
			dispatchConfiguration({type: 'SET_OPPORTUNITY', payload: value});
		},
		[dispatchConfiguration]
	);

	/**********************************************************************************************
	 ** The user can come to this page with a bunch of query arguments. If this is the case, we
	 ** should populate the form with the values from the query arguments.
	 ** The valid query arguments are:
	 ** - tokenAddress: The address of the token to be deposited.
	 ** - vaultAddress: The address of the vault to be deposited in.
	 ** The uniqueIdentifier is used to prevent the useEffect from overwriting the form values
	 ** once we have set them from the query arguments.
	 *********************************************************************************************/
	useEffect(() => {
		const {tokenAddress, vaultAddress} = router.query;

		if (uniqueIdentifier.current || !tokenAddress) {
			return;
		}

		if (!isZeroAddress(tokenAddress as string) && isAddress(tokenAddress as string)) {
			const token = getToken({address: tokenAddress as TAddress, chainID: chain.id});
			if (isZeroAddress(token.address)) {
				return;
			}
			dispatchConfiguration({
				type: 'SET_ASSET',
				payload: {
					token,
					amount: token.balance.display,
					normalizedBigAmount: token.balance,
					isValid: true,
					error: undefined
				}
			});

			if (vaultAddress && !isZeroAddress(vaultAddress as string) && isAddress(vaultAddress as string)) {
				const vault = userVaults[vaultAddress as TAddress];
				vault && onSetOpportunity(vault);
			}

			uniqueIdentifier.current = createUniqueID(serialize(router.query));
		}
	}, [chain.id, dispatchConfiguration, getToken, onSetAsset, onSetOpportunity, router, router.query, userVaults]);

	useEffect(() => {
		return () => {
			uniqueIdentifier.current = undefined;
		};
	}, []);

	const getZapsBadgeContent = useCallback(() => {
		if (isFetchingQuote) {
			return <p>{'Checking possible routes...'}</p>;
		}

		if (!quote) {
			return <p>{'Sorry! No possible routes found for this configuration!'}</p>;
		}

		return (
			<div className={'flex w-full justify-between gap-4'}>
				<p className={'max-w-[357px]'}>
					{'Hey! We gonna swap your tokens so you can use this opportunity. Don’t worry, no extra clicks.'}
				</p>
				<div className={'flex items-center gap-2'}>
					<p className={'text-base'}>{configuration.asset.token?.symbol}</p>
					<IconArrow />
					<p className={'text-base'}>{configuration.opportunity?.token.symbol}</p>
				</div>
			</div>
		);
	}, [configuration.asset.token?.symbol, configuration.opportunity?.token.symbol, isFetchingQuote, quote]);

	return (
		<div className={' z-20 flex w-full flex-col items-center gap-10'}>
			<div className={'border-grey-200 w-full max-w-[560px] rounded-3xl border bg-white p-4 md:p-6'}>
				<div className={'flex w-full flex-col gap-2'}>
					<GimmeTokenAmountInput
						onSetValue={onSetAsset}
						value={configuration.asset}
					/>

					{!isWithdrawing && <SelectOpportunityButton onSetOpportunity={onSetOpportunity} />}
					{isZapNeeded ? (
						<div
							className={
								'bg-grey-0 border-grey-200 text-grey-700 w-full items-center rounded-2xl border p-4 pr-6 text-xs font-medium md:min-h-[66px]'
							}>
							{getZapsBadgeContent()}
						</div>
					) : null}
					<EarnWizard />
				</div>
			</div>
		</div>
	);
}
