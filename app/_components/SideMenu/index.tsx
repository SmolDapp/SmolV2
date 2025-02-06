import {SideMenuFooter} from '@lib/components/SideMenu/SideMenuFooter';
import {SideMenuNav} from '@lib/components/SideMenu/SideMenuNav';
import {SideMenuProfile} from '@lib/components/SideMenu/SideMenuProfile';

import type {TSideMenuItem} from '@lib/components/SideMenu/SideMenuNav';
import type {ReactElement} from 'react';

export function SideMenu(props: {menu?: TSideMenuItem[]}): ReactElement {
	return (
		<>
			<SideMenuProfile />
			<div className={'h-0.5 w-full bg-neutral-200'} />
			<SideMenuNav {...props} />
			<SideMenuFooter />
		</>
	);
}
