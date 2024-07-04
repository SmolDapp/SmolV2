import Image from 'next/image';

import type {ReactElement} from 'react';

export function BackgroundLanding(): ReactElement {
	return (
		<>
			<div className={'bg-grey-500 absolute -z-20 h-screen w-screen'} />

			{/* Bottom Left *********************************************************************/}
			<Image
				className={'none invisible absolute bottom-0 left-0 -z-10 h-[541px] object-cover md:visible'}
				src={'/bottom-left-no-hand.svg'}
				alt={'bottom-left'}
				width={781}
				height={541}
			/>
			<Image
				className={'visible absolute bottom-0 left-0 -z-10 h-[240px] object-cover md:invisible'}
				src={'/bottom-left-no-hand.svg'}
				alt={'bottom-left'}
				width={346}
				height={240}
			/>
			{/***********************************************************************************/}

			{/* Bottom Right ********************************************************************/}
			<Image
				className={'none invisible absolute bottom-0 right-0 -z-10 h-[383px] object-cover md:visible'}
				src={'/bottom-right.svg'}
				alt={'bottom-right'}
				width={736}
				height={383}
			/>
			{/***********************************************************************************/}
		</>
	);
}
