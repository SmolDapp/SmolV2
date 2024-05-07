import {type ReactElement} from 'react';

import {RevokeWizard} from './Wizard';

export function Revoke(): ReactElement {
	return (
		<div className={'max-w-108 w-full'}>
			<RevokeWizard />
		</div>
	);
}
