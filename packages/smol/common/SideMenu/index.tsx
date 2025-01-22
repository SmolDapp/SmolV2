import {SideMenuFooter} from 'packages/smol/common/SideMenu/SideMenuFooter';
import {SideMenuNav} from 'packages/smol/common/SideMenu/SideMenuNav';
import {SideMenuProfile} from 'packages/smol/common/SideMenu/SideMenuProfile';

import type {TSideMenuItem} from 'packages/smol/common/SideMenu/SideMenuNav';
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
