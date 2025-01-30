import type {ReactElement} from 'react';

export function WalletListHeader(): ReactElement {
	return (
		<>
			<div className={'mb-2 flex justify-between text-xs'}>
				<p>{'Token'}</p>
				<p>{'Balance'}</p>
			</div>
			<div className={'mb-2 h-px bg-neutral-400'} />
		</>
	);
}
