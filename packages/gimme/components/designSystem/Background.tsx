/* eslint-disable @next/next/no-img-element */
import type {ReactElement} from 'react';

export function Background(): ReactElement {
	return (
		<>
			<img
				className={'absolute top-0 z-10 w-full object-cover'}
				src={'/top-middle.svg'}
				alt={'top-middle'}
			/>

			<img
				className={'absolute bottom-0 z-10 w-full object-contain'}
				src={'/bottom-middle.svg'}
				alt={'bottom-middle'}
			/>

			<img
				className={'none invisible absolute left-0 top-0 z-10 h-1/4 object-cover md:visible'}
				src={'/top-left.svg'}
				alt={'top-left'}
			/>

			<img
				className={'none invisible absolute bottom-0 right-0 z-10 h-2/5 object-cover md:visible'}
				src={'/bottom-right.svg'}
				alt={'bottom-right'}
			/>

			{/* Top Right ***********************************************************************/}
			<img
				className={'none 2/5 invisible absolute right-0 top-0 z-10 object-cover md:visible'}
				src={'/top-right.svg'}
				alt={'top-right'}
			/>
			<img
				className={'visible absolute right-0 top-0 z-10 w-full object-cover  md:invisible'}
				src={'/top-right.svg'}
				alt={'top-right'}
			/>
			{/***********************************************************************************/}

			{/* Bottom Left *********************************************************************/}
			<img
				className={'none invisible absolute bottom-0 left-0 z-10 h-3/5 object-cover md:visible'}
				src={'/bottom-left.svg'}
				alt={'bottom-left'}
			/>
			<img
				className={'visible absolute bottom-0 left-0 z-10 w-full object-cover md:invisible'}
				src={'/bottom-left.svg'}
				alt={'bottom-left'}
			/>
			{/***********************************************************************************/}
		</>
	);
}
