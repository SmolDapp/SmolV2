import {toAddress} from '@lib/utils/tools.addresses';
import {MultisafeContextApp} from 'app/(apps)/multisafe/contexts/useMultisafe';

import {SafeCloneContent} from './content';

import type {ReactElement} from 'react';

export default async function MultisafeClonableWrapper({
	params
}: {
	params: Promise<{address: string}>;
}): Promise<ReactElement> {
	const address = (await params).address;

	return (
		<MultisafeContextApp>
			<SafeCloneContent safeAddress={toAddress(address)} />
		</MultisafeContextApp>
	);
}
