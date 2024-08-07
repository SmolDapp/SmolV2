import type {Dispatch} from 'react';
import type {TToken} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TYDaemonVault} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

export type TWithdrawConfiguration = {
	asset: TTokenAmountInputElement;
	vault: TYDaemonVault | undefined;
	tokenToReceive: TToken | undefined;
};

export type TWithdrawActions =
	| {type: 'SET_ASSET'; payload: Partial<TTokenAmountInputElement>}
	| {type: 'SET_VAULT'; payload: TYDaemonVault | undefined}
	| {type: 'SET_TOKEN_TO_RECEIVE'; payload: TToken}
	| {type: 'SET_CONFIGURATION'; payload: TWithdrawConfiguration}
	| {type: 'RESET'; payload: undefined};

export type TWithdraw = {
	configuration: TWithdrawConfiguration;
	dispatchConfiguration: Dispatch<TWithdrawActions>;
	onResetWithdraw: () => void;
};
