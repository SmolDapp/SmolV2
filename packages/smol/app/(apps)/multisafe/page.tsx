'use client';

import {useRouter} from 'next/navigation';
import React from 'react';

import {IconClone} from '@lib/icons/IconClone';
import IconSquarePlus from '@lib/icons/IconSquarePlus';
import CardWithIcon from 'packages/smol/app/(apps)/multisafe/components/CardWithIcon';
import {MultisafeContextApp} from 'packages/smol/app/(apps)/multisafe/contexts/useMultisafe';

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
					onClick={async () => router.push('/multisafe/clone-safe')}
				/>
				<CardWithIcon
					icon={<IconSquarePlus />}
					label={'Create a Safe'}
					description={'Create your own fancy new safe with your own custom address!'}
					onClick={async () => router.push('/multisafe/new-safe')}
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
