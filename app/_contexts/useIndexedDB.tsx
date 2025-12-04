import {createContext, useEffect} from 'react';
import setupIndexedDB from 'use-indexeddb';

import type {IndexedDBConfig} from 'use-indexeddb/dist/interfaces';

const smolIDBConfig: IndexedDBConfig = {
	databaseName: 'smol',
	version: 5,
	stores: [
		{
			name: 'address-book',
			id: {keyPath: 'id', autoIncrement: true},
			indices: [
				{name: 'address', keyPath: 'address', options: {unique: true}},
				{name: 'label', keyPath: 'label'},
				{name: 'slugifiedLabel', keyPath: 'slugifiedLabel'},
				{name: 'chains', keyPath: 'chains'},
				{name: 'isFavorite', keyPath: 'isFavorite'},
				{name: 'isHidden', keyPath: 'isHidden'},
				{name: 'tags', keyPath: 'tags'},
				{name: 'numberOfInteractions', keyPath: 'numberOfInteractions'}
			]
		},
		{
			name: 'approve-events',
			id: {keyPath: 'id', autoIncrement: true},
			indices: [
				{name: 'UID', keyPath: 'UID', options: {unique: true}}, //Special UID for the event: chainID + address + spender + blockNumber + logIndex
				{name: 'address', keyPath: 'address'},
				{name: 'balanceOf', keyPath: 'balanceOf'},
				{name: 'blockNumber', keyPath: 'blockNumber'},
				{name: 'chainID', keyPath: 'chainID'},
				{name: 'decimals', keyPath: 'decimals'},
				{name: 'logIndex', keyPath: 'logIndex'},
				{name: 'name', keyPath: 'name'},
				{name: 'owner', keyPath: 'owner'},
				{name: 'sender', keyPath: 'sender'},
				{name: 'symbol', keyPath: 'symbol'},
				{name: 'value', keyPath: 'value'}
			]
		},
		{
			name: 'approve-events-chain-sync',
			id: {keyPath: 'id', autoIncrement: true},
			indices: [
				{name: 'chainID', keyPath: 'chainID'},
				{name: 'address', keyPath: 'address'},
				{name: 'blockNumber', keyPath: 'blockNumber'}
			]
		}
	]
};

const defaultProps = smolIDBConfig;
const IndexDBContext = createContext<IndexedDBConfig>(defaultProps);
export const IndexedDB = ({children}: {children: React.ReactElement}): React.ReactElement => {
	useEffect(() => {
		setupIndexedDB(smolIDBConfig)
			.then(() => {
				console.log('IndexedDB initialized');
			})
			.catch(error => {
				console.error('Error initializing IndexedDB:', error);
			});
	}, []);

	return <IndexDBContext.Provider value={smolIDBConfig}>{children}</IndexDBContext.Provider>;
};
