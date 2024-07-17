import {createContext, useContext, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

import {useIsBridgeNeeded} from '../hooks/helpers/useIsBridgeNeeded';
import {useIsZapNeeded} from '../hooks/helpers/useIsZapNeeded';
import {useLifiSolver} from '../hooks/solvers/useLifiSolver';
import {usePortalsSolver} from '../hooks/solvers/usePortalsSolver';
import {useVanilaSolver} from '../hooks/solvers/useVanilaSolver';
import {type TWithdrawSolverHelper, useWithdraw} from '../hooks/solvers/useWithdraw';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TPortalsEstimate} from '@lib/utils/api.portals';
import type {LiFiStep} from '@lifi/sdk';

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

	isFetchingQuote: boolean;
	quote: TPortalsEstimate | LiFiStep | null;
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
	const {isZapNeededForDeposit, isZapNeededForWithdraw} = useIsZapNeeded(configuration);
	const {isBridgeNeededForDeposit, isBridgeNeededForWithdraw} = useIsBridgeNeeded(configuration);
	const vanila = useVanilaSolver(
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw
	);
	const portals = usePortalsSolver(
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw
	);
	const lifi = useLifiSolver(
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw
	);
	const withdrawHelper = useWithdraw();

	const currentSolver = useMemo(() => {
		if (isBridgeNeededForDeposit && configuration.action === 'DEPOSIT') {
			return lifi;
		}
		if (isBridgeNeededForWithdraw && configuration.action === 'WITHDRAW') {
			return lifi;
		}
		if (isZapNeededForDeposit && configuration.action === 'DEPOSIT') {
			return portals;
		}
		if (isZapNeededForWithdraw && configuration.action === 'WITHDRAW') {
			return portals;
		}

		return vanila;
	}, [
		configuration.action,
		isBridgeNeededForDeposit,
		isBridgeNeededForWithdraw,
		isZapNeededForDeposit,
		isZapNeededForWithdraw,
		lifi,
		portals,
		vanila
	]);

	return <SolverContext.Provider value={{...currentSolver, ...withdrawHelper}}>{children}</SolverContext.Provider>;
}
export const useSolver = (): TSolverContext => useContext(SolverContext);
