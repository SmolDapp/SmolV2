import {createContext, useContext, useMemo} from 'react';
import {isAddress, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus, type TTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

import {useVanilaSolver} from '../hooks/solvers/useVanilaSolver';

import type {ReactElement} from 'react';
import type {TNormalizedBN} from '@builtbymom/web3/types';

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
	onExecuteDeposit: async (): Promise<void> => undefined
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useEarnFlow();

	const vanila = useVanilaSolver();

	const currentSolver = useMemo(() => {
		const isZapNeeded =
			isAddress(configuration.asset.token?.address) &&
			isAddress(configuration.opportunity?.token.address) &&
			configuration.asset.token?.address !== configuration.opportunity?.token.address;

		if (!isZapNeeded) {
			return vanila;
		}
		if (isZapNeeded && configuration.asset.token?.chainID === configuration.opportunity?.chainID) {
			//return portals
		}
		// return lifi;
		return vanila; // temp
	}, [
		configuration.asset.token?.address,
		configuration.asset.token?.chainID,
		configuration.opportunity?.chainID,
		configuration.opportunity?.token.address,
		vanila
	]);
	return <SolverContext.Provider value={currentSolver}>{children}</SolverContext.Provider>;
}
export const useSolvers = (): TSolverContext => useContext(SolverContext);
