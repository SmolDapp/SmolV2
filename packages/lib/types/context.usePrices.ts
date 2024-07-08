import type {TAddress, TDict, TNDict, TNormalizedBN, TToken} from '@builtbymom/web3/types';

/**************************************************************************************************
 ** The TPrices type is used to type the prices object. The object is a dictionary of dictionaries,
 ** where the first key is the chainID and the second key is the token address. The value is the
 ** price of the token on the chain in a normalized format.
 *************************************************************************************************/
export type TPrices = TNDict<TDict<TNormalizedBN>>;

/**************************************************************************************************
 ** The TToken type is used to type the token object. The following properties are available:
 ** - address: The address of the token.
 ** - chainID: The chain ID of the token.
 ** It's only used for some utils functions to work with the prices/tokens.
 *************************************************************************************************/
export type TPriceTokens = Pick<TToken, 'address' | 'chainID'>[];

/**************************************************************************************************
 ** The TGetPriceProps type is used to type the props of the getPrice function. The following
 ** properties are available:
 ** - chainID: The chain ID of the token.
 ** - address: The address of the token.
 *************************************************************************************************/
export type TGetPriceProps = {chainID: number; address: TAddress};

/**************************************************************************************************
 ** The TPricesProps type is used to type the props of the usePrices hook. The following properties
 ** are available:
 ** - pricingHash: The hash of the prices object, which change every time the prices are updated.
 **   This is to prevent some issues with hooks, memoization and array comparison.
 ** - prices: The prices object, which contains the prices for the tokens per chain in a normalized
 **   format.
 ** - getPrice: A function that will return the price for a token. It will return undefined if the
 **   price is not available.
 ** - getPrices: A function that will return the prices for a list of tokens. It will return an
 **   empty object if the prices are not available.
 *************************************************************************************************/
export type TPricesProps = {
	pricingHash: string;
	prices: TPrices;
	getPrice: (value: TGetPriceProps, shouldFetch?: boolean) => TNormalizedBN | undefined;
	getPrices: (tokens: TToken[]) => TNDict<TDict<TNormalizedBN>>;
};

/**************************************************************************************************
 ** The TLLamaPricesEndpointResponse type is used to type the response of the Llama prices
 ** endpoint.
 ** The following properties are available:
 ** - coins: A dictionary of dictionaries, where the first key is the token address and the second
 **   key is the value. The values are:
 **   - decimals: The number of decimals of the token.
 **   - price: The price of the token.
 *************************************************************************************************/
export type TLLamaPricesEndpointResponse = {
	coins: TDict<{
		decimals: number;
		price: string;
	}>;
};
