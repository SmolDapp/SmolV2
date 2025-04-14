import type {Metadata} from 'next';

export const metadata: Metadata = {
	title: 'SmolV2',
	description: 'SmolV2 Application',
	manifest: '/manifest.json',
	icons: {
		icon: [
			{url: '/favicons/favicon.ico'},
			{url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
			{url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png'}
		],
		apple: [{url: '/favicons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png'}]
	},
	themeColor: '#000000',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'SmolV2'
	}
};
