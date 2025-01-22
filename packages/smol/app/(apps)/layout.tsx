import AppHeading from 'packages/smol/app/(apps)/_appHeading';
import AppInfo from 'packages/smol/app/(apps)/_appInfo';

import type {ReactElement, ReactNode} from 'react';

function AppLayout(props: {children: ReactNode}): ReactElement {
	return (
		<div>
			<div className={'flex w-full justify-end'}>
				<AppInfo />
			</div>
			<section className={'-mt-2 w-full p-4 md:p-8'}>
				<AppHeading />
				{props.children}
			</section>
		</div>
	);
}
export default AppLayout;
