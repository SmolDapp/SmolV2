import {Fragment} from 'react';
import {SendQueryManagement} from 'components/sections/Send/useSendQuery';
import {Swap} from 'components/sections/Swap';
import {SwapContextApp} from 'components/sections/Swap/useSwapFlow.lifi';
import {BalancesCurtainContextApp} from 'contexts/useBalancesCurtain';

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
