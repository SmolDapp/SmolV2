import {type ReactElement, useCallback, useEffect, useRef} from 'react';
import {useRouter} from 'next/router';
import {SmolTokenAmountInput} from 'lib/common/SmolTokenAmountInput';
import {useSolvers} from 'packages/gimme/contexts/useSolver';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isAddress, isZeroAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {SelectOpportunityButton} from '@gimmmeSections/Earn/SelectVaultButton';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {EarnWizard} from './EarnWizard';
import {useEarnFlow} from './useEarnFlow';

import type {TAddress} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export function Earn(): ReactElement {
	const router = useRouter();
	const {chainID} = useWeb3();

	const {getToken} = useWallet();
	const {vaultsArray, userVaults} = useVaults();
	const {configuration, dispatchConfiguration} = useEarnFlow();
	const uniqueIdentifier = useRef<string | undefined>(undefined);

	const {quote} = useSolvers();

	const isZapNeeded =
		isAddress(configuration.asset.token?.address) &&
		isAddress(configuration.opportunity?.token.address) &&
		configuration.asset.token?.address !== configuration.opportunity?.token.address;

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

	const onClearAsset = useCallback(() => {
		dispatchConfiguration({
			type: 'SET_ASSET',
			payload: {
				amount: '',
				normalizedBigAmount: zeroNormalizedBN,
				isValid: 'undetermined',
				token: undefined,
				status: 'none',
				UUID: crypto.randomUUID()
			}
		});
	}, [dispatchConfiguration]);

	const onClearOpportunity = useCallback(() => {
		dispatchConfiguration({
			type: 'SET_OPPORTUNITY',
			payload: undefined
		});
	}, [dispatchConfiguration]);

	const getZapsBadgeContent = useCallback(() => {
		// if (!quote) {
		// 	return <p className={'text-neutral-600'}>{'Checking possible routes...'}</p>;
		// }

		if (!quote) {
			return <p className={'text-neutral-600'}>{'Sorry! No possible routes found for this configuration!'}</p>;
		}

		return (
			<>
				<p className={'text-xxs leading-2 mb-10 text-neutral-600'}>
					{'Hey! We gonna swap your tokens so you can use this opportunity'}
				</p>
				<p className={'mb-2 text-lg font-bold leading-8'}>
					{`${configuration.asset.token?.symbol} -> ${configuration.opportunity?.token.symbol}`}
				</p>
				<p className={'text-xxs leading-2 text-neutral-600'}>{"Don't worry! No extra clicks needed"}</p>
			</>
		);
	}, [configuration.asset.token?.symbol, configuration.opportunity?.token.symbol, quote]);

	return (
		<div className={'flex w-full flex-col items-center gap-10'}>
			<div className={'w-full max-w-[504px] rounded-2xl bg-white p-8 shadow-xl'}>
				<div className={'w-full'}>
					<div className={'mb-1 flex items-center justify-between text-xs font-medium'}>
						<p>{'Asset'}</p>
						<button
							onClick={onClearAsset}
							className={'rounded-sm  p-1 text-neutral-600 transition-colors hover:text-neutral-700'}>
							{'Clear asset'}
						</button>
					</div>
					<SmolTokenAmountInput
						onSetValue={onSetAsset}
						value={configuration.asset}
						variant={'gimme'}
						displayNetworkIcon
					/>
					<div className={'mb-1 mt-6 flex items-center justify-between text-xs font-medium'}>
						<p>{'Opportunity'}</p>
						<button
							onClick={onClearOpportunity}
							className={'rounded-sm  p-1 text-neutral-600 transition-colors hover:text-neutral-700'}>
							{'Clear Opportunity'}
						</button>
					</div>
					<SelectOpportunityButton
						onSetOpportunity={onSetOpportunity}
						filteredVaults={vaultsArray}
					/>
					<EarnWizard />
				</div>
			</div>
			{isZapNeeded && configuration.asset.token?.address !== configuration.opportunity?.address && (
				<div
					className={
						'flex h-[168px] w-full max-w-[472px] flex-col items-center justify-center rounded-2xl bg-neutral-300'
					}>
					{getZapsBadgeContent()}
				</div>
			)}
		</div>
	);
}
