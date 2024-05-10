import {SideMenuFooter} from '@lib/common/SideMenu/SideMenuFooter';
import {SideMenuNav} from '@lib/common/SideMenu/SideMenuNav';
import {SideMenuProfile} from '@lib/common/SideMenu/SideMenuProfile';

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
