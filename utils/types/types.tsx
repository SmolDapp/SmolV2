import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';

export type TModify<TOriginal, TModification> = Omit<TOriginal, keyof TModification> & TModification;

/**************************************************************************************************
 ** Acts like Partial, but requires all properties to be explicity set to undefined if missing.
 *************************************************************************************************/
export type TPartialExhaustive<T> = {[Key in keyof T]: T[Key] | undefined};

/**************************************************************************************************
 ** Used to properly type the data returned from the usePrices hook.
 *************************************************************************************************/
export type TPrice = {
	data: {[key: TAddress]: TNormalizedBN} | undefined;
};
