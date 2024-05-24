import React from 'react';
import {useRouter} from 'next/router';
import CardWithIcon from '@smolSections/Multisafe/CardWithIcon';
import {MultisafeContextApp} from '@smolSections/Multisafe/useMultisafe';
import {IconClone} from '@lib/icons/IconClone';
import IconSquarePlus from '@lib/icons/IconSquarePlus';

import type {ReactElement} from 'react';

function Safe(): ReactElement {
	const router = useRouter();

	return (
		<div className={'grid w-full max-w-[600px]'}>
			<div className={'grid gap-4'}>
				<CardWithIcon
					icon={<IconClone />}
					label={'Clone a Safe'}
					description={
						'Clone an existing safe with the original configuration: same address, same owner, same threshold, different chain!'
					}
					onClick={async () => router.push('/apps/multisafe/clone-safe')}
				/>
				<CardWithIcon
					icon={<IconSquarePlus />}
					label={'Create a Safe'}
					description={'Create your own fancy new safe with your own custom address!'}
					onClick={async () => router.push('/apps/multisafe/new-safe')}
				/>
			</div>
		</div>
	);
}

export default function MultisafeWrapper(): ReactElement {
	return (
		<MultisafeContextApp>
			<Safe />
		</MultisafeContextApp>
	);
}

MultisafeWrapper.AppName = 'MultiSafe';
MultisafeWrapper.AppDescription =
	'Make your multi-sig, multi-chain: get the same Safe address on all chains. Wow, fancy!';
MultisafeWrapper.AppInfo = (
	<>
		<p>{'Well, basically, it’s… your wallet. '}</p>
		<p>{'You can see your tokens. '}</p>
		<p>{'You can switch chains and see your tokens on that chain. '}</p>
		<p>{'You can switch chains again and see your tokens on that chain too. '}</p>
		<p>{'I don’t get paid by the word so… that’s about it.'}</p>
	</>
);
