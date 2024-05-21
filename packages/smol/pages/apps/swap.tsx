import {Fragment} from 'react';
import {BalancesCurtainContextApp} from '@smolContexts/useBalancesCurtain';
import {Swap} from '@smolSections/Swap';
import {SwapContextApp} from '@smolSections/Swap/useSwapFlow.lifi';
import {SwapQueryManagement} from '@smolSections/Swap/useSwapQuery';

import type {ReactElement} from 'react';

function SwapPage(): ReactElement {
	return (
		<SwapContextApp>
			{({configuration: {input, output}}) => (
				<SwapQueryManagement>
					<BalancesCurtainContextApp selectedTokens={[input, output].map(elem => elem.token).filter(Boolean)}>
						<Swap />
					</BalancesCurtainContextApp>
				</SwapQueryManagement>
			)}
		</SwapContextApp>
	);
}

SwapPage.AppName = 'Swap';
SwapPage.AppDescription =
	'Swap tokens on the same chain, or across different chains. It’s the future, but like… right now.';
SwapPage.AppInfo = (
	<>
		<div className={'mb-4 h-px w-full bg-neutral-300'} />
		<p className={'text-sm text-neutral-900'}>{'Smol Swap is powered by Li.Fi'}</p>
		<p className={'text-sm'}>{'It allows you to swap tokens on the same chain, or across different chains. '}</p>
		<p className={'text-sm'}>
			{'You can even use it like a bridge by swapping to the same token on your destination chain. '}
		</p>
		<br />
		<p className={'text-sm text-neutral-900'}>{'Using Smol Swap is simple.'}</p>
		<div className={'mt-2'}>
			<p className={'text-sm font-medium'}>{'Step 1:'}</p>
			<p className={'pl-4 text-sm'}>{'Select the network you want to swap tokens from.'}</p>
			<br />

			<p className={'text-sm font-medium'}>{'Step 2:'}</p>
			<p className={'pl-4 text-sm'}>{'Select the token you want to swap from.'}</p>
			<br />

			<p className={'text-sm font-medium'}>{'Step 3:'}</p>
			<p className={'pl-4 text-sm'}>{'Select the network you want to receive the swapped token on.'}</p>
			<br />

			<p className={'text-sm font-medium'}>{'Step 4:'}</p>
			<p className={'pl-4 text-sm'}>{'Select the token you want to receive after the swap has been executed.'}</p>
			<p className={'pl-4 text-sm'}>
				{'For example you might want to swap DAI on Ethereum to USDC on Base. Fancy!'}
			</p>
		</div>

		<br />
		<p className={'text-sm text-neutral-900'}>{'Surprise, more tokens!'}</p>
		<p className={'text-sm'}>
			{
				"Smol swap will always display the MINIMUM amount of tokens you'll receieve. So you might end up with extra tokens - it's like a bonus but you didn't have to laugh at your bosses jokes."
			}
		</p>
		<br />
		<p className={'text-sm text-neutral-900'}>{'We have a fee'}</p>
		<p className={'text-sm'}>{'Smol charges a 0.3% fee on swaps to fund starving devs. Ty'}</p>
	</>
);
SwapPage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default SwapPage;
