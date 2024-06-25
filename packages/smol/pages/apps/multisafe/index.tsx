import React from 'react';
import {useRouter} from 'next/router';
import {MultisafeAppInfo} from 'packages/smol/components/Multisafe/AppInfo';
import CardWithIcon from 'packages/smol/components/Multisafe/CardWithIcon';
import {MultisafeContextApp} from 'packages/smol/components/Multisafe/useMultisafe';
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

MultisafeWrapper.AppName = 'Welcome to Multisafe';
MultisafeWrapper.AppDescription =
	'Get the same Safe address on every chain. Either create a new safe, or clone an existing one to start.';
MultisafeWrapper.AppInfo = <MultisafeAppInfo />;
MultisafeWrapper.MetadataTitle = 'Multisafe';
MultisafeWrapper.MetadataDescription = 'Multisafe';
MultisafeWrapper.MetadataURI = 'https://smold.app/apps/multisafe';
MultisafeWrapper.MetadataOG = 'https://smold.app/og.png';
MultisafeWrapper.MetadataTitleColor = '#000000';
MultisafeWrapper.MetadataThemeColor = '#FFD915';
