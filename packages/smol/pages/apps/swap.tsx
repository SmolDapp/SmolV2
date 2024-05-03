import {Fragment} from 'react';
import {BalancesCurtainContextApp} from '@contexts/useBalancesCurtain';
import {SendQueryManagement} from '@sections/Send/useSendQuery';
import {Swap} from '@sections/Swap';
import {SwapContextApp} from '@sections/Swap/useSwapFlow.lifi';

import type {ReactElement} from 'react';

export default function SendPage(): ReactElement {
	return (
		<SwapContextApp>
			{({configuration: {input, output}}) => (
				<SendQueryManagement>
					<BalancesCurtainContextApp
						selectedTokenAddresses={[input, output].map(input => input.token?.address).filter(Boolean)}>
						<Swap />
					</BalancesCurtainContextApp>
				</SendQueryManagement>
			)}
		</SwapContextApp>
	);
}

SendPage.AppName = 'Swap';
SendPage.AppDescription = 'Swap swap swap swap swap';
SendPage.AppInfo = (
	<>
		<p>{'Something about swapping.'}</p>
	</>
);
SendPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};
