/* eslint-disable @typescript-eslint/naming-convention */
import type {MetadataRoute} from 'next';

const siteConfig = {
	name: 'Smol Dapp',
	description: 'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.',
	url: 'https://smold.app',
	ogImage: 'https://smold.app/og.png'
};

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: siteConfig.name,
		short_name: siteConfig.name,
		description: siteConfig.description, 
		start_url: '/',
		icons: [
			{
				src: '/favicons/android-icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any'
			},
			{
				src: '/favicons/android-icon-144x144.png',
				sizes: '144x144',
				type: 'image/png'
			},
            {
				src: '/favicons/favicon-512x512.png',
				sizes: '512x512', 
				type: 'image/png'
			}
		]
	};
}

