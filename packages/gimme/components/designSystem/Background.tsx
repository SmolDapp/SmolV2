import Image from 'next/image';

import type {ReactElement} from 'react';

export function Background(): ReactElement {
	return (
		<>
			<Image
				className={'absolute top-0  z-10 h-[308px] object-cover'}
				src={'/top-middle.svg'}
				alt={'top-middle'}
				width={2232}
				height={309}
			/>

			<Image
				className={'absolute bottom-0  z-10 h-[469px] object-cover'}
				src={'/bottom-middle.svg'}
				alt={'bottom-middle'}
				width={3603}
				height={469}
			/>

			{/* Bottom Left *********************************************************************/}
			<Image
				className={'none invisible absolute bottom-0 left-0 z-10 h-[599px] object-cover md:visible'}
				src={'/bottom-left.svg'}
				alt={'bottom-left'}
				width={863}
				height={599}
			/>
			<Image
				className={'visible absolute bottom-0 left-0 z-10  h-[240px] object-cover md:invisible'}
				src={'/bottom-left.svg'}
				alt={'bottom-left'}
				width={346}
				height={240}
			/>
			{/***********************************************************************************/}

			{/* Top Right ***********************************************************************/}
			<Image
				className={'none invisible absolute right-0 top-0  z-10 h-[460px] object-cover md:visible'}
				src={'/top-right.svg'}
				alt={'top-right'}
				width={955}
				height={460}
			/>
			<Image
				className={'visible absolute right-0 top-0 z-10 h-[184px] object-cover  md:invisible'}
				src={'/top-right.svg'}
				alt={'top-right'}
				width={383}
				height={184}
			/>
			{/***********************************************************************************/}

			<Image
				className={'none invisible absolute left-0 top-0 z-10 h-[278px] object-cover md:visible'}
				src={'/top-left.svg'}
				alt={'top-left'}
				width={618}
				height={278}
			/>

			<Image
				className={'none invisible absolute bottom-0 right-0 z-10 h-[383px] object-cover md:visible'}
				src={'/bottom-right.svg'}
				alt={'bottom-right'}
				width={736}
				height={383}
			/>
		</>
	);
}
