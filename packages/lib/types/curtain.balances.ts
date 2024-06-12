import type {ReactElement} from 'react';
import type {TAddress, TChainTokens, TToken} from '@builtbymom/web3/types';

/**************************************************************************************************
 ** The TSelectCallback type is an helper type used to type the callback function that is called
 ** when a token is selected.
 *************************************************************************************************/
export type TSelectCallback = (item: TToken) => void;

/**************************************************************************************************
 ** The TWalletLayoutProps type is used to type the props of the WalletLayout component.
 *************************************************************************************************/
export type TWalletLayoutProps = {
	filteredTokens: TToken[];
	selectedTokens?: TToken[];
	onSelect?: TSelectCallback;
	searchTokenAddress?: TAddress;
	chainID: number;
	onOpenChange: (isOpen: boolean) => void;
};

/**************************************************************************************************
 ** The TBalancesCurtain type is used to type the props of the BalancesCurtain component.
 *************************************************************************************************/
export type TBalancesCurtain = {
	isOpen: boolean;
	onRefresh: () => Promise<TChainTokens>;
	tokensWithBalance: TToken[];
	allTokens: TToken[];
	onSelect: TSelectCallback | undefined;
	selectedTokens?: TToken[];
	onOpenChange: (isOpen: boolean) => void;
	options: TBalancesCurtainOptions;
};

/**************************************************************************************************
 ** The TBalancesCurtainOptions type is used to type the options of the BalancesCurtain component.
 *************************************************************************************************/
export type TBalancesCurtainOptions = {
	chainID?: number;
	withTabs?: boolean;
};
/**************************************************************************************************
 ** The TBalancesCurtainContextProps type is used to type the props of the BalancesCurtainContext
 ** component.
 *************************************************************************************************/
export type TBalancesCurtainContextProps = {
	shouldOpenCurtain: boolean;
	tokensWithBalance: TToken[];
	onOpenCurtain: (callbackFn: TSelectCallback, options?: TBalancesCurtainOptions) => void;
	onCloseCurtain: () => void;
};

/**************************************************************************************************
 ** The TBalancesCurtainContextAppProps type is used to type the props of the
 ** BalancesCurtainContextApp context component.
 *************************************************************************************************/
export type TBalancesCurtainContextAppProps = {
	children: ReactElement;
	selectedTokens?: TToken[];
};

/**************************************************************************************************
 ** The TBalancesCurtainContextAppProps type is used to type the props of the
 ** BalancesCurtainContextApp context component.
 *************************************************************************************************/
export type TTokenListSummary = {
	lists: {
		URI: string;
		decription: string;
		logoURI: string;
		name: string;
		tokenCount: number;
	}[];
};
