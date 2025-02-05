import React from 'react';

import {toAddress} from '@lib/utils/tools.addresses';
import {SafeCreateContent} from 'app/(apps)/multisafe/(create)/new-safe/[address]/content';
import {MultisafeContextApp} from 'app/(apps)/multisafe/contexts/useMultisafe';

import type {ReactElement} from 'react';

export default async function MultisafeNewWrapper({
	params
}: {
	params: Promise<{address: string}>;
}): Promise<ReactElement> {
	const address = (await params).address;

	return (
		<MultisafeContextApp>
			<SafeCreateContent safeAddress={toAddress(address)} />
		</MultisafeContextApp>
	);
}
