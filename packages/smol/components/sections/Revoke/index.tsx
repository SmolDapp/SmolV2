import {type ReactElement} from 'react';

import {RevokeWizard} from './Wizard';

export function Revoke(): ReactElement {
	return (
		<div className={'w-full'}>
			<RevokeWizard />
		</div>
	);
}
