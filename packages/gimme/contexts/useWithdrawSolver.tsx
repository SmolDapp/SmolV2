import {createContext, useContext, useMemo} from 'react';
import useWallet from '@builtbymom/web3/contexts/useWallet';
import {toAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useWithdrawFlow} from '@gimmmeSections/Portfolio/Withdraw/useWithdrawFlow';

import {useIsZapNeeded} from '../hooks/helpers/useIsZapNeeded';
import {usePortalsSolver} from '../hooks/solvers/usePortalsSolver';
import {type TWithdrawSolverHelper, useWithdraw} from '../hooks/solvers/useWithdraw';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TTokenAmountInputElement} from '@lib/types/utils';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

/**************************************************************************************************
 * This type is a return type of every solver. It should stay the same for every new solver added
 *************************************************************************************************/
export type TSolverContextBase = {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess?: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	onExecuteForGnosis: (onSuccess: () => void) => Promise<void>;

	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
type TSolverContext = TSolverContextBase & TWithdrawSolverHelper;

const WithdrawSolverContext = createContext<TSolverContext>({
	approvalStatus: defaultTxStatus,
	onApprove: async (): Promise<void> => undefined,
	allowance: zeroNormalizedBN,
	isDisabled: false,
	isApproved: false,
	isFetchingAllowance: false,

	withdrawStatus: defaultTxStatus,
	onExecuteWithdraw: async (): Promise<void> => undefined,
	set_withdrawStatus: (): void => undefined,

	depositStatus: defaultTxStatus,
	set_depositStatus: (): void => undefined,
	onExecuteDeposit: async (): Promise<void> => undefined,

	onExecuteForGnosis: async (): Promise<void> => undefined,

	isFetchingQuote: false,
	quote: null
});

export function WithdrawSolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useWithdrawFlow();
	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.tokenToReceive?.address);

	const {getToken} = useWallet();
	const vaultToken = getToken({
		address: toAddress(configuration.vault?.address),
		chainID: configuration.vault?.chainID || 137
	});

	const vaultInputElementLike: TTokenAmountInputElement = useMemo(
		() => ({
			amount: configuration.asset.normalizedBigAmount.display,
			normalizedBigAmount: configuration?.asset?.normalizedBigAmount,
			isValid: 'undetermined',
			token: vaultToken,
			status: 'none',
			UUID: crypto.randomUUID()
		}),
		[configuration.asset.normalizedBigAmount, vaultToken]
	);
	const portals = usePortalsSolver(vaultInputElementLike, configuration.tokenToReceive?.address, isZapNeeded);
	const withdrawHelper = useWithdraw(configuration.asset, configuration.vault);

	return (
		<WithdrawSolverContext.Provider value={{...portals, ...withdrawHelper}}>
			{children}
		</WithdrawSolverContext.Provider>
	);
}
export const useWithdrawSolver = (): TSolverContext => useContext(WithdrawSolverContext);
