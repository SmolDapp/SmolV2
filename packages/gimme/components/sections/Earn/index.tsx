import {type ReactElement, useCallback, useEffect, useMemo, useRef} from 'react';
import {useRouter} from 'next/router';
import {SmolTokenAmountInput} from 'lib/common/SmolTokenAmountInput';
import {useVaults} from 'packages/gimme/contexts/useVaults';
import {isAddressEqual} from 'viem';
import {mainnet, polygon} from 'viem/chains';
import {serialize} from 'wagmi';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {ETH_TOKEN_ADDRESS, isAddress, isZeroAddress, toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {SelectOpportunityButton} from '@gimmmeSections/Earn/SelectVaultButton';
import {createUniqueID} from '@lib/utils/tools.identifiers';

import {EarnWizard} from './EarnWizard';
import {useEarnFlow} from './useEarnFlow';

import type {TTokenAmountInputElement} from 'packages/lib/types/Inputs';
import type {TAddress, TNDict} from '@builtbymom/web3/types';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

const WRAPPED_TOKEN_ADDRESS: TNDict<TAddress> = {
	[mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
	[polygon.id]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'
};

export function Earn(): ReactElement {
	const router = useRouter();
	const {chainID} = useWeb3();

	const {getToken} = useWallet();
	const {vaults, userVaults} = useVaults();
	const {configuration, dispatchConfiguration} = useEarnFlow();
	const uniqueIdentifier = useRef<string | undefined>(undefined);

	const onSetAsset = useCallback(
		(value: Partial<TTokenAmountInputElement>): void => {
			dispatchConfiguration({type: 'SET_ASSET', payload: value});

			// Remove opportunity selection only if new token is selected that is not linked to selected opportunity
			if (
				value.token &&
				configuration.asset.token?.address !== value.token.address &&
				configuration.opportunity?.token.address !== value.token?.address
			) {
				dispatchConfiguration({type: 'SET_OPPORTUNITY', payload: undefined});
			}
		},
		[configuration.asset.token?.address, configuration.opportunity?.token.address, dispatchConfiguration]
	);

	const onSetOpportunity = useCallback(
		(value: TYDaemonVault | undefined): void => {
			dispatchConfiguration({type: 'SET_OPPORTUNITY', payload: value});
		},
		[dispatchConfiguration]
	);

	const filteredVaults = useMemo(() => {
		if (!configuration.asset.token?.address) {
			return vaults;
		}
		if (isAddressEqual(configuration.asset.token.address, ETH_TOKEN_ADDRESS)) {
			return vaults.filter(
				rawVault =>
					configuration.asset.token &&
					isAddressEqual(rawVault.token.address, WRAPPED_TOKEN_ADDRESS[configuration.asset.token?.chainID])
			);
		}
		return vaults.filter(rawVault => rawVault.token.address === toAddress(configuration.asset.token?.address));
	}, [configuration.asset.token, vaults]);

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
	}, [chainID, dispatchConfiguration, getToken, onSetAsset, onSetOpportunity, router.query, userVaults]);

	useEffect(() => {
		return () => {
			uniqueIdentifier.current = undefined;
		};
	});

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

	return (
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
				/>
				<p className={'mb-2 mt-6 text-xs font-medium '}>{'Opportunity'}</p>
				<SelectOpportunityButton
					onSetOpportunity={onSetOpportunity}
					filteredVaults={filteredVaults}
				/>
				<EarnWizard />
			</div>
		</div>
	);
}
