import {SideMenuFooter} from 'lib/common/designSystem/SideMenu/SideMenuFooter';
import {SideMenuNav} from 'lib/common/designSystem/SideMenu/SideMenuNav';
import {SideMenuProfile} from 'lib/common/designSystem/SideMenu/SideMenuProfile';

import type {ReactElement} from 'react';

export function SideMenu(): ReactElement {
	return (
		<>
			<SideMenuProfile />
			<div className={'h-0.5 w-full bg-neutral-200'} />
			<SideMenuNav />
			<SideMenuFooter />
		</>
	);
}
