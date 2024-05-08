import {type ReactElement, useMemo} from 'react';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {truncateHex} from '@builtbymom/web3/utils';

export function ConnectButton(): ReactElement {
	const {onConnect, address, chainID, ens, onDesactivate} = useWeb3();
	console.log(chainID);
	const buttonLabel = useMemo(() => {
		if (ens) {
			return ens;
		}
		if (address) {
			return truncateHex(address, 5);
		}
		return 'Connect wallet';
	}, [address, ens]);

	return (
		<button
			onClick={address ? onDesactivate : onConnect}
			className={'rounded-lg border px-4 py-2 text-xs font-bold transition-colors'}>
			{buttonLabel}
		</button>
	);
}
