import {createContext, useContext, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

import {useIsZapNeeded} from '../hooks/helpers/useIsZapNeeded';
import {usePortalsSolver} from '../hooks/solvers/usePortalsSolver';
import {useVanilaSolver} from '../hooks/solvers/useVanilaSolver';
import {type TWithdrawSolverHelper, useWithdraw} from '../hooks/solvers/useWithdraw';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

/**************************************************************************************************
 * This type is a return type of every solver. It should stay the same for every new solver added
 *************************************************************************************************/
export type TSolverContextBase = {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	isFetchingQuote: boolean;
	quote: TPortalsEstimate | null;
};

/**
 * Return type of the solver context. It consists of 2 parts:
 * 1. Current solver actions
 * 2. Current solver withdraw actions (same for every solver)
 */
type TSolverContext = TSolverContextBase & TWithdrawSolverHelper;

const SolverContext = createContext<TSolverContext>({
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

	isFetchingQuote: false,
	quote: null
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useEarnFlow();
	const vanila = useVanilaSolver();
	const portals = usePortalsSolver();
	const withdrawHelper = useWithdraw();
	const isZapNeeded = useIsZapNeeded();

	const currentSolver = useMemo(() => {
		if (!isZapNeeded) {
			return vanila;
		}
		if (configuration.asset.token?.chainID === configuration.opportunity?.chainID) {
			return portals;
		}
		// return lifi;
		return vanila; // temp
	}, [configuration.asset.token?.chainID, configuration.opportunity?.chainID, isZapNeeded, portals, vanila]);

	return <SolverContext.Provider value={{...currentSolver, ...withdrawHelper}}>{children}</SolverContext.Provider>;
}
export const useSolvers = (): TSolverContext => useContext(SolverContext);
