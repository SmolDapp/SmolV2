/* eslint-disable array-bracket-newline */
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import useSWR from 'swr';
import {baseFetcher, isZeroAddress} from '@builtbymom/web3/utils';
import {defaultInputAddressLike} from '@lib/utils/tools.address';
import {CHAINS} from '@lib/utils/tools.chains';

import type {TAddress, TDict} from '@builtbymom/web3/types';
import type {TInputAddressLike} from '@lib/utils/tools.address';

export type TPriceFromGecko = TDict<{usd: number}>;
export type TInputAddressLikeWithUUID = TInputAddressLike & {UUID: string};

export type TMultisafeProps = {
	threshold: number;
	onUpdateThreshold: (threshold: number) => void;
	owners: TInputAddressLikeWithUUID[];
	onAddOwner: () => void;
	onSetOwners: (address: TAddress[]) => void;
	onUpdateOwner: (UUID: string, value: TInputAddressLikeWithUUID) => void;
	onRemoveOwner: (UUID: string) => void;
	chainCoinPrices: TPriceFromGecko;
};
const defaultProps: TMultisafeProps = {
	threshold: 1,
	onUpdateThreshold: () => undefined,
	owners: [{...defaultInputAddressLike, UUID: '0'}],
	onAddOwner: () => undefined,
	onSetOwners: () => undefined,
	onUpdateOwner: () => undefined,
	onRemoveOwner: () => undefined,
	chainCoinPrices: {}
};

const MultisafeContext = createContext<TMultisafeProps>(defaultProps);
export const MultisafeContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [threshold, set_threshold] = useState(1);
	const [owners, set_owners] = useState<TInputAddressLikeWithUUID[]>([
		{...defaultInputAddressLike, UUID: crypto.randomUUID()}
	]);

	const uniqueCoingeckoGasCoinIDs = useMemo(() => {
		const uniques = [];
		for (const item of Object.values(CHAINS)) {
			uniques.push(item.coingeckoGasCoinID);
		}
		return [...new Set(uniques)].join(',');
	}, []);

	const {data: chainCoinPrices} = useSWR<TPriceFromGecko>(
		`https://api.coingecko.com/api/v3/simple/price?ids=${uniqueCoingeckoGasCoinIDs}&vs_currencies=usd`,
		baseFetcher,
		{refreshInterval: 10_000}
	);

	const onRemoveOwnerByUUID = useCallback((UUID: string): void => {
		set_owners(prev => {
			if (prev.length === 1) {
				return [{...defaultInputAddressLike, UUID: crypto.randomUUID()}];
			}
			return prev.filter((row): boolean => row.UUID !== UUID);
		});
	}, []);

	const onUpdateOwnerByUUID = useCallback((UUID: string, newValue: TInputAddressLikeWithUUID): void => {
		set_owners(prev => prev.map((row): TInputAddressLikeWithUUID => (row.UUID === UUID ? newValue : row)));
	}, []);

	const onAddOwner = useCallback((): void => {
		set_owners(prev => [...prev, {...defaultInputAddressLike, UUID: crypto.randomUUID()}]);
	}, []);

	const onSetOwners = useCallback((addresses: TAddress[]): void => {
		set_owners(() => {
			return addresses.map(
				(address): TInputAddressLikeWithUUID => ({
					...defaultInputAddressLike,
					address,
					label: address,
					source: 'autoPopulate',
					isValid: !isZeroAddress(address),
					UUID: crypto.randomUUID()
				})
			);
		});
	}, []);

	const contextValue = useMemo(
		(): TMultisafeProps => ({
			threshold,
			onUpdateThreshold: set_threshold,
			owners,
			onAddOwner,
			onSetOwners,
			onUpdateOwner: onUpdateOwnerByUUID,
			onRemoveOwner: onRemoveOwnerByUUID,
			chainCoinPrices: chainCoinPrices || {}
		}),
		[threshold, owners, onAddOwner, onSetOwners, onUpdateOwnerByUUID, onRemoveOwnerByUUID, chainCoinPrices]
	);

	return <MultisafeContext.Provider value={contextValue}>{children}</MultisafeContext.Provider>;
};

export const useMultisafe = (): TMultisafeProps => useContext(MultisafeContext);
