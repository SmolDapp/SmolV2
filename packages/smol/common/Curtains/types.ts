import type {TAddress} from '@lib/utils/tools.addresses';
import type {TChainERC20Tokens, TERC20TokensWithBalance} from '@lib/utils/tools.erc20';

/**************************************************************************************************
 ** The TSelectCallback type is an helper type used to type the callback function that is called
 ** when a token is selected.
 *************************************************************************************************/
export type TSelectCallback = (item: TERC20TokensWithBalance) => void;

/**************************************************************************************************
 ** The TWalletLayoutProps type is used to type the props of the WalletLayout component.
 *************************************************************************************************/
export type TWalletLayoutProps = {
	filteredTokens: TERC20TokensWithBalance[];
	selectedTokens?: TERC20TokensWithBalance[];
	searchTokenAddress?: TAddress;
	chainID: number;
	onSelect?: TSelectCallback;
	onOpenChange: (isOpen: boolean) => void;
};

/**************************************************************************************************
 ** The TBalancesCurtain type is used to type the props of the BalancesCurtain component.
 *************************************************************************************************/
export type TBalancesCurtain = {
	isOpen: boolean;
	tokensWithBalance: TERC20TokensWithBalance[];
	allTokens: TERC20TokensWithBalance[];
	selectedTokens?: TERC20TokensWithBalance[];
	underlyingTokens: TERC20TokensWithBalance[];
	options: TBalancesCurtainOptions;
	onOpenChange: (isOpen: boolean) => void;
	onSelect: TSelectCallback | undefined;
	onRefresh: () => Promise<TChainERC20Tokens>;
};

/**************************************************************************************************
 ** The TBalancesCurtainOptions type is used to type the options of the BalancesCurtain component.
 *************************************************************************************************/
export type TBalancesCurtainOptions = {
	chainID?: number;
	withTabs?: boolean;
	shouldBypassBalanceCheck?: boolean;
	highlightedTokens?: TERC20TokensWithBalance[];
};
/**************************************************************************************************
 ** The TBalancesCurtainContextProps type is used to type the props of the BalancesCurtainContext
 ** component.
 *************************************************************************************************/
export type TBalancesCurtainContextProps = {
	shouldOpenCurtain: boolean;
	tokensWithBalance: TERC20TokensWithBalance[];
	onOpenCurtain: (callbackFn: TSelectCallback, options?: TBalancesCurtainOptions) => void;
	onCloseCurtain: () => void;
};

/**************************************************************************************************
 ** The TTokenListSummary type is used to type the summary of the token list.
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
