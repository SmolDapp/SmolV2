import {createContext, useContext, useMemo} from 'react';
import {isAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

import {usePortalsSolver} from '../hooks/solvers/usePortalsSolver';
import {useVanilaSolver} from '../hooks/solvers/useVanilaSolver';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';
import type {TPortalsEstimate} from '@lib/utils/api.portals';

export type TSolverContext = {
	/** Approval part */
	approvalStatus: TTxStatus;
	onApprove: (onSuccess: () => void) => Promise<void>;
	allowance: TNormalizedBN;
	isDisabled: boolean;
	isApproved: boolean;
	isFetchingAllowance: boolean;

	/** Withdraw part */
	withdrawStatus: TTxStatus;
	onExecuteWithdraw: (onSuccess: () => void) => Promise<void>;
	set_withdrawStatus: (value: TTxStatus) => void;

	/** Deposit part */
	depositStatus: TTxStatus;
	onExecuteDeposit: (onSuccess: () => void) => Promise<void>;
	set_depositStatus: (value: TTxStatus) => void;

	quote: TPortalsEstimate | null;
};

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

	quote: null
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useEarnFlow();

	const vanila = useVanilaSolver();
	const portals = usePortalsSolver();

	// TODO: optimize by adding init
	const currentSolver = useMemo(() => {
		const isZapNeeded =
			isAddress(configuration.asset.token?.address) &&
			isAddress(configuration.opportunity?.token.address) &&
			configuration.asset.token?.address !== configuration.opportunity?.token.address;

		if (!isZapNeeded) {
			return vanila;
		}
		if (configuration.asset.token?.chainID === configuration.opportunity?.chainID) {
			return {
				...portals,
				onExecuteWithdraw: vanila.onExecuteWithdraw,
				set_withdrawStatus: vanila.set_withdrawStatus,
				withdrawStatus: vanila.withdrawStatus
			};
		}
		// return lifi;
		return vanila; // temp
	}, [
		configuration.asset.token?.address,
		configuration.asset.token?.chainID,
		configuration.opportunity?.chainID,
		configuration.opportunity?.token.address,
		portals,
		vanila
	]);
	return <SolverContext.Provider value={currentSolver}>{children}</SolverContext.Provider>;
}
export const useSolvers = (): TSolverContext => useContext(SolverContext);
