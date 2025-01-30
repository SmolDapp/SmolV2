import Image from 'next/image';

import type {ReactElement} from 'react';

export function SideMenuFooter(): ReactElement {
	return (
		<div className={'flex justify-between rounded-b-lg bg-primary px-6 py-3'}>
			<Image
				src={'/smol.svg'}
				alt={'smol'}
				width={'56'}
				height={'24'}
			/>
			<Image
				src={'/mouse.svg'}
				alt={'smol'}
				width={'32'}
				height={'24'}
			/>
		</div>
	);
}
