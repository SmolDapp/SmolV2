/* eslint-disable @next/next/no-img-element */
import type {ReactElement} from 'react';

export function BackgroundLanding(): ReactElement {
	return (
		<>
			<img
				className={'absolute bottom-0 z-10 w-full object-cover'}
				src={'/bottom-middle.svg'}
				alt={'bottom-middle'}
			/>

			{/* Bottom Left *********************************************************************/}
			<img
				className={'none invisible absolute bottom-0 left-0 z-10  w-2/5 object-cover md:visible'}
				src={'/bottom-left-no-hand.svg'}
				alt={'bottom-left'}
			/>
			<img
				className={'visible absolute bottom-0 left-0 z-10 w-full object-cover md:invisible'}
				src={'/bottom-left-no-hand.svg'}
				alt={'bottom-left'}
			/>
			{/***********************************************************************************/}

			{/* Bottom Right ********************************************************************/}
			<img
				className={'none invisible absolute bottom-0 right-0 z-10 w-2/5 object-cover md:visible'}
				src={'/bottom-right.svg'}
				alt={'bottom-right'}
			/>
			{/***********************************************************************************/}
		</>
	);
}
