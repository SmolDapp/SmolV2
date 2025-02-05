'use client';

/* eslint-disable array-bracket-newline */
import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import useSWR from 'swr';

import {defaultInputAddressLike, isZeroAddress} from '@lib/utils/tools.addresses';
import {CHAINS} from '@lib/utils/tools.chains';
import {baseFetcher} from '@lib/utils/tools.fetchers';

import type {TAddress, TInputAddressLike} from '@lib/utils/tools.addresses';

export type TInputAddressLikeWithUUID = TInputAddressLike & {UUID: string};
type TPriceFromGecko = Record<string, {usd: number}>;

type TMultisafeProps = {
	threshold: number;
	onUpdateThreshold: (threshold: number) => void;
	owners: TInputAddressLikeWithUUID[];
	onAddOwner: () => void;
	onSetOwners: (address: TAddress[]) => void;
	onUpdateOwner: (UUID: string, value: TInputAddressLikeWithUUID) => void;
	onRemoveOwner: (UUID: string) => void;
	onClickFAQ: () => void;
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
	onClickFAQ: () => undefined,
	chainCoinPrices: {}
};

const MultisafeContext = createContext<TMultisafeProps>(defaultProps);
export const MultisafeContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	const [threshold, setThreshold] = useState(1);
	const [owners, setOwners] = useState<TInputAddressLikeWithUUID[]>([
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
		setOwners(prev => {
			if (prev.length === 1) {
				return [{...defaultInputAddressLike, UUID: crypto.randomUUID()}];
			}
			return prev.filter((row): boolean => row.UUID !== UUID);
		});
	}, []);

	const onUpdateOwnerByUUID = useCallback((UUID: string, newValue: TInputAddressLikeWithUUID): void => {
		setOwners(prev => prev.map((row): TInputAddressLikeWithUUID => (row.UUID === UUID ? newValue : row)));
	}, []);

	const onAddOwner = useCallback((): void => {
		setOwners(prev => [...prev, {...defaultInputAddressLike, UUID: crypto.randomUUID()}]);
	}, []);

	const onSetOwners = useCallback((addresses: TAddress[]): void => {
		setOwners(() => {
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
			onUpdateThreshold: setThreshold,
			owners,
			onAddOwner,
			onSetOwners,
			onUpdateOwner: onUpdateOwnerByUUID,
			onRemoveOwner: onRemoveOwnerByUUID,
			chainCoinPrices: chainCoinPrices || {},
			onClickFAQ: () => document.getElementById('info-curtain-trigger')?.click()
		}),
		[threshold, owners, onAddOwner, onSetOwners, onUpdateOwnerByUUID, onRemoveOwnerByUUID, chainCoinPrices]
	);

	return <MultisafeContext.Provider value={contextValue}>{children}</MultisafeContext.Provider>;
};

export const useMultisafe = (): TMultisafeProps => useContext(MultisafeContext);
