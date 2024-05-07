import React, {createContext, useContext} from 'react';
import setupIndexedDB from 'use-indexeddb';
import {useMountEffect} from '@react-hookz/web';

import type {IndexedDBConfig} from 'use-indexeddb/dist/interfaces';

const smolIDBConfig: IndexedDBConfig = {
	databaseName: 'smol',
	version: 3,
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
				{name: 'address', keyPath: 'address'},
				{name: 'owner', keyPath: 'owner'},
				{name: 'sender', keyPath: 'sender'},
				{name: 'value', keyPath: 'value'},
				{name: 'blockHash', keyPath: 'blockHash'},
				{name: 'blockNumber', keyPath: 'blockNumber'},
				{name: 'data', keyPath: 'data'},
				{name: 'eventName', keyPath: 'eventName'},
				{name: 'logIndex', keyPath: 'logIndex'},
				{name: 'removed', keyPath: 'removed'},
				{name: 'topics', keyPath: 'topics'},
				{name: 'transactionHash', keyPath: 'transactionHash'},
				{name: 'transactionIndex', keyPath: 'transactionIndex'}
			]
		}
	]
};

type TIndexDBContext = IndexedDBConfig;

const defaultProps = smolIDBConfig;
const IndexDBContext = createContext<TIndexDBContext>(defaultProps);
export const IndexedDB = ({children}: {children: React.ReactElement}): React.ReactElement => {
	useMountEffect(async () => {
		setupIndexedDB(smolIDBConfig);
	});

	return <IndexDBContext.Provider value={smolIDBConfig}>{children}</IndexDBContext.Provider>;
};

export const useIndexDB = (): TIndexDBContext => {
	const ctx = useContext(IndexDBContext);
	if (!ctx) {
		throw new Error('IndexDBContext not found');
	}
	return ctx;
};
