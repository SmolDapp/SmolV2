import {createContext, useContext, useMemo} from 'react';
import {zeroNormalizedBN} from '@builtbymom/web3/utils';
import {defaultTxStatus} from '@builtbymom/web3/utils/wagmi';
import {useEarnFlow} from '@gimmmeSections/Earn/useEarnFlow';

import {useIsZapNeeded} from '../hooks/helpers/useIsZapNeeded';
import {usePortalsSolver} from '../hooks/solvers/usePortalsSolver';
import {useVanilaSolver} from '../hooks/solvers/useVanilaSolver';

import type {ReactElement} from 'react';
import type {TSolverContextBase} from './useSolver.types';

const SolverContext = createContext<TSolverContextBase>({
	approvalStatus: defaultTxStatus,
	onApprove: async (): Promise<void> => undefined,
	allowance: zeroNormalizedBN,
	isDisabled: false,
	isApproved: false,
	isFetchingAllowance: false,

	depositStatus: defaultTxStatus,
	set_depositStatus: (): void => undefined,
	onExecuteDeposit: async (): Promise<void> => undefined,

	onExecuteForGnosis: async (): Promise<void> => undefined,

	isFetchingQuote: false,
	quote: null
});

export function SolverContextApp({children}: {children: ReactElement}): ReactElement {
	const {configuration} = useEarnFlow();
	const {isZapNeeded} = useIsZapNeeded(configuration.asset.token?.address, configuration.opportunity?.token.address);
	const vanila = useVanilaSolver(
		configuration.asset,
		configuration.opportunity?.address,
		configuration.opportunity?.version,
		isZapNeeded
	);
	const portals = usePortalsSolver(configuration.asset, configuration.opportunity?.address, isZapNeeded);

	const currentSolver = useMemo(() => {
		if (isZapNeeded) {
			return portals;
		}
		return vanila;
	}, [isZapNeeded, portals, vanila]);
	return <SolverContext.Provider value={currentSolver}>{children}</SolverContext.Provider>;
}
export const useSolver = (): TSolverContextBase => useContext(SolverContext);
