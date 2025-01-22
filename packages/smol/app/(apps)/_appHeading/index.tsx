'use client';

import {usePathname} from 'next/navigation';
import {useCallback} from 'react';

import type {ReactElement} from 'react';

export default function AppHeading(): ReactElement {
	const pathName = usePathname();
	const getContent = useCallback((): {title: string; description: string} => {
		if (pathName?.startsWith('/wallet') || pathName?.startsWith('/apps/wallet') || pathName === '/') {
			return {title: 'Wallet', description: 'Check your wallet on any chain (it’s in the sidebar bruv)'};
		}
		if (pathName?.startsWith('/address-book') || pathName?.startsWith('/apps/address-book')) {
			return {
				title: 'Address Book',
				description: 'Keep your friends close and your enemies closer'
			};
		}
		if (pathName?.startsWith('/disperse') || pathName?.startsWith('/apps/disperse')) {
			return {
				title: 'Disperse',
				description: 'Transfer funds to multiple receivers'
			};
		}
		if (pathName?.startsWith('/revoke') || pathName?.startsWith('/apps/revoke')) {
			return {
				title: 'Revoke',
				description: 'Take control of your contract approvals with Revoke.'
			};
		}
		if (pathName?.startsWith('/send') || pathName?.startsWith('/apps/send')) {
			return {
				title: 'Send',
				description: 'Deliver any of your tokens anywhere'
			};
		}
		if (pathName?.startsWith('/swap') || pathName?.startsWith('/apps/swap')) {
			return {
				title: 'Swap',
				description:
					'Swap tokens on the same chain, or across different chains. It’s the future, but like… right now.'
			};
		}
		if (pathName?.startsWith('/multisafe') || pathName?.startsWith('/apps/multisafe')) {
			if (pathName?.startsWith('/multisafe/new-safe') || pathName?.startsWith('/apps/multisafe/new-safe')) {
				return {
					title: 'One new Safe, coming right up.',
					description:
						'Create your Multisafe by choosing it’s owners, and setting the amount of signers needed for transactions. (P.s you can customise your safe with a prefix and suffix if you want).'
				};
			}
			if (pathName?.startsWith('/multisafe/clone-safe') || pathName?.startsWith('/apps/multisafe/clone-safe')) {
				return {
					title: 'Make your Safe a Multisafe',
					description: 'Clone your existing Safe and give it the same address on every chain..'
				};
			}

			return {
				title: 'Multisafe',
				description:
					'Get the same Safe address on every chain. Either create a new safe, or clone an existing one to start.'
			};
		}

		return {
			title: 'Nothing here!',
			description: 'We can’t find the page you’re looking for. But here’s a smol mouse!'
		};
	}, [pathName]);

	const {title, description} = getContent();

	return (
		<div className={'md:max-w-108 mb-6 flex w-full flex-row justify-between'}>
			<div>
				<h1 className={'pr-6 text-2xl font-bold text-neutral-900 md:whitespace-nowrap md:pr-0 md:text-3xl'}>
					{title}
				</h1>
				<p className={'pt-2 text-base text-neutral-600 md:pt-1'}>{description}</p>
			</div>
		</div>
	);
}
