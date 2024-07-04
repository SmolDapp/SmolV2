import Image from 'next/image';
import {Button} from '@lib/primitives/Button';

import type {ReactElement} from 'react';

export function Landing(): ReactElement {
	return (
		<div className={'flex-col items-center justify-center'}>
			<div className={'relative'}>
				<Image
					className={'rounded-5xl'}
					src={'/bg.svg'}
					width={1200}
					height={660}
					alt={'bg'}
				/>
				<Image
					className={'absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2'}
					src={'/gimme-text-white.svg'}
					width={671}
					height={160}
					alt={'gimme'}
				/>
				<Button className={'!absolute !top-[65%] left-1/2 w-[206px] -translate-x-1/2 !rounded-[20px]'}>
					{'Launch App'}
				</Button>
				<Image
					className={'absolute right-1/4 top-[60%] w-[8%]'}
					src={'/by-mom-cloud.svg'}
					width={82}
					height={35}
					alt={'by-mom'}
				/>
			</div>
		</div>
	);
}
