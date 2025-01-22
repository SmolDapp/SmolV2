import {IconPlus} from '@lib/icons/IconPlus';
import {cl} from '@lib/utils/helpers';

import type {ReactElement} from 'react';

export function AddContactButton(props: {onOpenCurtain: VoidFunction; label?: string}): ReactElement {
	return (
		<button
			onClick={props.onOpenCurtain}
			className={cl(
				'rounded-lg p-2 text-xs flex flex-row items-center',
				'bg-primary text-neutral-900 transition-colors hover:bg-primaryHover'
			)}>
			<IconPlus className={'mr-2 size-3 text-neutral-900'} />
			{props.label || 'Add contact'}
		</button>
	);
}
