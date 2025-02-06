import Link from 'next/link';

import {Button} from '@lib/components/Button';
import {IconSmolMouse} from '@lib/components/icons/IconSmolMouse';

import type {ReactElement} from 'react';

export default function NotFoundPage(): ReactElement {
	return (
		<div
			className={
				'flex h-[calc(100vh-500px)] w-full flex-col items-center justify-center md:h-[calc(100vh-350px)]'
			}>
			<div className={'relative'}>
				<p
					className={
						'text-[100px] font-bold leading-[100px] text-neutral-800 md:text-[200px] md:leading-[200px]'
					}>
					{'404'}
				</p>
				<IconSmolMouse
					className={'absolute left-1/2 top-2/3 size-10 -translate-x-1/2 -translate-y-2/3 md:size-24'}
				/>
			</div>
			<Link href={'/wallet'}>
				<Button className={'!h-8'}>{'Go Back'}</Button>
			</Link>
		</div>
	);
}

NotFoundPage.AppName = 'Nothing here!';
NotFoundPage.AppDescription = 'We can’t find the page you’re looking for. But here’s a smol mouse!';

/**************************************************************************************************
 ** Metadata for the page: 404
 *************************************************************************************************/
NotFoundPage.MetadataTitle = 'Smol - Built by MOM';
NotFoundPage.MetadataDescription =
	'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.';
NotFoundPage.MetadataURI = 'https://smold.app';
NotFoundPage.MetadataOG = 'https://smold.app/og.png';
NotFoundPage.MetadataTitleColor = '#000000';
NotFoundPage.MetadataThemeColor = '#FFD915';
