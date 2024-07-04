import {type ReactElement, useCallback, useEffect, useRef} from 'react';
import Image from 'next/image';
import {useRouter} from 'next/router';
import {useSolvers} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {useGetIsStablecoin} from 'packages/gimme/hooks/helpers/useGetIsStablecoin';
import {useIsZapNeeded} from 'packages/gimme/hooks/helpers/useIsZapNeeded';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isAddress, isZeroAddress} from '@builtbymom/web3/utils';
import {GimmeTokenAmountInput} from '@gimmeDesignSystem/GimmeTokenAmountInput';
import {SelectOpportunityButton} from '@gimmmeSections/Earn/SelectVaultButton';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {EarnWizard} from './EarnWizard';
import {useEarnFlow} from './useEarnFlow';

import type {TAddress, TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function Earn(): ReactElement {
	const router = useRouter();
	const {chainID} = useWeb3();

	const {getToken} = useWallet();
	const {userVaults} = useVaults();
	const {configuration, dispatchConfiguration} = useEarnFlow();
	const uniqueIdentifier = useRef<string | undefined>(undefined);

	const {getIsStablecoin} = useGetIsStablecoin();

	const {quote, isFetchingQuote} = useSolvers();
	const isZapNeeded = useIsZapNeeded();

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
		if (tokenAddress && !isZeroAddress(tokenAddress as string) && isAddress(tokenAddress as string)) {
			const token = getToken({address: tokenAddress as TAddress, chainID});

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
		}

		if (vaultAddress && !isZeroAddress(vaultAddress as string) && isAddress(vaultAddress as string)) {
			const vault = userVaults[vaultAddress as TAddress];

			vault && onSetOpportunity(vault);
		}

		uniqueIdentifier.current = createUniqueID(serialize(router.query));
	}, [chainID, dispatchConfiguration, getToken, onSetAsset, onSetOpportunity, router, router.query, userVaults]);

	useEffect(() => {
		return () => {
			uniqueIdentifier.current = undefined;
		};
	}, []);

	const getZapsBadgeContent = useCallback(() => {
		if (isFetchingQuote) {
			return <p className={'text-neutral-600'}>{'Checking possible routes...'}</p>;
		}

		if (!quote) {
			return <p className={'text-neutral-600'}>{'Sorry! No possible routes found for this configuration!'}</p>;
		}

		return (
			<div className={'flex w-full justify-between'}>
				<p className={'max-w-[357px]'}>
					{'Hey! We gonna swap your tokens so you can use this opportunity. Don’t worry, no extra clicks.'}
				</p>
				<div className={'flex items-center gap-2'}>
					<p>{configuration.asset.token?.symbol}</p>
					<Image
						src={'/arrow.svg'}
						alt={'arrow'}
						width={16}
						height={10}
					/>
					<p>{configuration.opportunity?.token.symbol}</p>
				</div>
			</div>
		);
	}, [configuration.asset.token?.symbol, configuration.opportunity?.token.symbol, isFetchingQuote, quote]);

	const onSelectTokenCallback = useCallback(
		(token: TToken) => {
			const isStablecoin = getIsStablecoin({
				address: token.address,
				chainID: token.chainID
			});

			if (configuration.opportunity?.category === 'Stablecoin' && isStablecoin) {
				return;
			}

			if (configuration.opportunity?.token.address === token.address) {
				return;
			}

			onSetOpportunity(undefined);
		},
		[
			configuration.opportunity?.category,
			configuration.opportunity?.token.address,
			getIsStablecoin,
			onSetOpportunity
		]
	);

	return (
		<div className={'flex w-full flex-col items-center gap-10'}>
			<div className={'w-full max-w-[560px] rounded-2xl bg-white p-8 shadow-xl'}>
				<div className={'flex w-full flex-col gap-2'}>
					<GimmeTokenAmountInput
						onSetValue={onSetAsset}
						value={configuration.asset}
						onSelectTokenCallback={onSelectTokenCallback}
					/>

					<SelectOpportunityButton onSetOpportunity={onSetOpportunity} />
					{isZapNeeded && configuration.asset.token?.address !== configuration.opportunity?.address && (
						<div
							className={
								'bg-grey-100 border-grey-200 text-grey-700 w-full items-center rounded-2xl border py-4 pl-4 pr-6 text-xs'
							}>
							{getZapsBadgeContent()}
						</div>
					)}
					<EarnWizard />
				</div>
			</div>
		</div>
	);
}
