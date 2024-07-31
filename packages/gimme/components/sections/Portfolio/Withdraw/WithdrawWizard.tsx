import {Button} from '@lib/primitives/Button';

import type {ReactElement} from 'react';

export function WithdrawWizard(): ReactElement {
	return <Button className={'!text-grey-900 w-full !rounded-2xl !font-bold'}>{'Withdraw'}</Button>;
}
