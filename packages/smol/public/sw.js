if (!self.define) {
	let e,
		c = {};
	const s = (s, a) => (
		(s = new URL(s + '.js', a).href),
		c[s] ||
			new Promise(c => {
				if ('document' in self) {
					const e = document.createElement('script');
					(e.src = s), (e.onload = c), document.head.appendChild(e);
				} else (e = s), importScripts(s), c();
			}).then(() => {
				let e = c[s];
				if (!e) throw new Error(`Module ${s} didn’t register its module`);
				return e;
			})
	);
	self.define = (a, i) => {
		const n = e || ('document' in self ? document.currentScript.src : '') || location.href;
		if (c[n]) return;
		let t = {};
		const d = e => s(e, n),
			r = {module: {uri: n}, exports: t, require: d};
		c[n] = Promise.all(a.map(e => r[e] || d(e))).then(e => (i(...e), t));
	};
}
define(['./workbox-26a94402'], function (e) {
	'use strict';
	importScripts(),
		self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{
					url: '/_next/static/Fgx_FQRIUedJR5WSFECUh/_buildManifest.js',
					revision: '2c59ff9184d9cb06682263d248abe626'
				},
				{
					url: '/_next/static/Fgx_FQRIUedJR5WSFECUh/_ssgManifest.js',
					revision: 'b6652df95db52feb4daf4eca35380933'
				},
				{url: '/_next/static/chunks/1094.e500ecac19ba55b9.js', revision: 'e500ecac19ba55b9'},
				{url: '/_next/static/chunks/1576.3b2c4cae17a82eff.js', revision: '3b2c4cae17a82eff'},
				{url: '/_next/static/chunks/164.eafd95e8e92dd0e9.js', revision: 'eafd95e8e92dd0e9'},
				{url: '/_next/static/chunks/1935-401fd8b0ceb5a3d2.js', revision: '401fd8b0ceb5a3d2'},
				{url: '/_next/static/chunks/1953.ee99fbe33bd7b6c8.js', revision: 'ee99fbe33bd7b6c8'},
				{url: '/_next/static/chunks/250.a3c28b054d396afb.js', revision: 'a3c28b054d396afb'},
				{url: '/_next/static/chunks/2526.0e87be8e84eb52b2.js', revision: '0e87be8e84eb52b2'},
				{url: '/_next/static/chunks/2546.b7645a599c10c0f3.js', revision: 'b7645a599c10c0f3'},
				{url: '/_next/static/chunks/2677.7861903427aae5fa.js', revision: '7861903427aae5fa'},
				{url: '/_next/static/chunks/2764.131df822b38b4bf5.js', revision: '131df822b38b4bf5'},
				{url: '/_next/static/chunks/2913.087ba08f87e8559d.js', revision: '087ba08f87e8559d'},
				{url: '/_next/static/chunks/3102-e6c01aaf24a6f8e5.js', revision: 'e6c01aaf24a6f8e5'},
				{url: '/_next/static/chunks/34.92e80d07272594bc.js', revision: '92e80d07272594bc'},
				{url: '/_next/static/chunks/3630.3c0ea0c493b85ce3.js', revision: '3c0ea0c493b85ce3'},
				{url: '/_next/static/chunks/3770.cb15da0d1d301f1e.js', revision: 'cb15da0d1d301f1e'},
				{url: '/_next/static/chunks/3795.772566eecfa5ba77.js', revision: '772566eecfa5ba77'},
				{url: '/_next/static/chunks/3850.67944b2a1cc77b2f.js', revision: '67944b2a1cc77b2f'},
				{url: '/_next/static/chunks/3910.7625f558b7fb2fa9.js', revision: '7625f558b7fb2fa9'},
				{url: '/_next/static/chunks/3b88668f.ddade1c2cfe7d68e.js', revision: 'ddade1c2cfe7d68e'},
				{url: '/_next/static/chunks/4130.0275ac48e4fea851.js', revision: '0275ac48e4fea851'},
				{url: '/_next/static/chunks/4134.d562644f12fdfcd3.js', revision: 'd562644f12fdfcd3'},
				{url: '/_next/static/chunks/4247.fd728996dc7c3dd6.js', revision: 'fd728996dc7c3dd6'},
				{url: '/_next/static/chunks/4276.f70623c41aa9119b.js', revision: 'f70623c41aa9119b'},
				{url: '/_next/static/chunks/4338.eb799aeeb286ce2c.js', revision: 'eb799aeeb286ce2c'},
				{url: '/_next/static/chunks/4378.ca0170dabe03d5b3.js', revision: 'ca0170dabe03d5b3'},
				{url: '/_next/static/chunks/4408.18dd193a3572ee04.js', revision: '18dd193a3572ee04'},
				{url: '/_next/static/chunks/4503.f1c040562426d277.js', revision: 'f1c040562426d277'},
				{url: '/_next/static/chunks/4697.e5f3f58204b57532.js', revision: 'e5f3f58204b57532'},
				{url: '/_next/static/chunks/4781.55f3e4ca810eeb9e.js', revision: '55f3e4ca810eeb9e'},
				{url: '/_next/static/chunks/5087.c240a39578a2eaf0.js', revision: 'c240a39578a2eaf0'},
				{url: '/_next/static/chunks/5090.cf7dbfa4b1323ecc.js', revision: 'cf7dbfa4b1323ecc'},
				{url: '/_next/static/chunks/525.96daa1fb08071505.js', revision: '96daa1fb08071505'},
				{url: '/_next/static/chunks/5399.f3d8505542ed218d.js', revision: 'f3d8505542ed218d'},
				{url: '/_next/static/chunks/5468.fbd37012d7844524.js', revision: 'fbd37012d7844524'},
				{url: '/_next/static/chunks/5477.2d39d9ecbaa9eac0.js', revision: '2d39d9ecbaa9eac0'},
				{url: '/_next/static/chunks/5483.64df71dac46619ec.js', revision: '64df71dac46619ec'},
				{url: '/_next/static/chunks/5688-d74b0e5c3b69c418.js', revision: 'd74b0e5c3b69c418'},
				{url: '/_next/static/chunks/577.48da575f1a6c1ed9.js', revision: '48da575f1a6c1ed9'},
				{url: '/_next/static/chunks/5898.233f6bd010904e2b.js', revision: '233f6bd010904e2b'},
				{url: '/_next/static/chunks/6101.847f3f6e39ac88da.js', revision: '847f3f6e39ac88da'},
				{url: '/_next/static/chunks/6138.aaea9859fc8cace0.js', revision: 'aaea9859fc8cace0'},
				{url: '/_next/static/chunks/6166.aff9b3e24e0c38c1.js', revision: 'aff9b3e24e0c38c1'},
				{url: '/_next/static/chunks/6221.aae5372a51adc41a.js', revision: 'aae5372a51adc41a'},
				{url: '/_next/static/chunks/6285.e9cc44bb44a0b049.js', revision: 'e9cc44bb44a0b049'},
				{url: '/_next/static/chunks/6287.f6354eca1778cd8e.js', revision: 'f6354eca1778cd8e'},
				{url: '/_next/static/chunks/6304.47df858920ea480b.js', revision: '47df858920ea480b'},
				{url: '/_next/static/chunks/6579.56b6b706b0d4b07a.js', revision: '56b6b706b0d4b07a'},
				{url: '/_next/static/chunks/6586.5684931990e9413d.js', revision: '5684931990e9413d'},
				{url: '/_next/static/chunks/6715.67c72519f4e21c0c.js', revision: '67c72519f4e21c0c'},
				{url: '/_next/static/chunks/6899.ad60e2c80fbebd40.js', revision: 'ad60e2c80fbebd40'},
				{url: '/_next/static/chunks/6934.63ef6c1aef217f6c.js', revision: '63ef6c1aef217f6c'},
				{url: '/_next/static/chunks/7042.a96dcce8bc864302.js', revision: 'a96dcce8bc864302'},
				{url: '/_next/static/chunks/7097.f76a491f2cc66dbf.js', revision: 'f76a491f2cc66dbf'},
				{url: '/_next/static/chunks/7179.5a8520c90b84a56b.js', revision: '5a8520c90b84a56b'},
				{url: '/_next/static/chunks/727-b3153a6a5879ea45.js', revision: 'b3153a6a5879ea45'},
				{url: '/_next/static/chunks/7474.49beec956a53eca3.js', revision: '49beec956a53eca3'},
				{url: '/_next/static/chunks/757.efba1013a772dd9b.js', revision: 'efba1013a772dd9b'},
				{url: '/_next/static/chunks/7750.e8e1b75c3506e8c6.js', revision: 'e8e1b75c3506e8c6'},
				{url: '/_next/static/chunks/8073-d7d67786a55ebf96.js', revision: 'd7d67786a55ebf96'},
				{url: '/_next/static/chunks/8268.c65063f4eccdf4d8.js', revision: 'c65063f4eccdf4d8'},
				{url: '/_next/static/chunks/8578.ca47087aabca883a.js', revision: 'ca47087aabca883a'},
				{url: '/_next/static/chunks/8602.a3bbfd22c4ab8003.js', revision: 'a3bbfd22c4ab8003'},
				{url: '/_next/static/chunks/8614.dbbc3cf5dc9fb7d9.js', revision: 'dbbc3cf5dc9fb7d9'},
				{url: '/_next/static/chunks/8681.f968d174433279ff.js', revision: 'f968d174433279ff'},
				{url: '/_next/static/chunks/8898.60b61c5d0ee59cc8.js', revision: '60b61c5d0ee59cc8'},
				{url: '/_next/static/chunks/895.4a3f8c610eadacb7.js', revision: '4a3f8c610eadacb7'},
				{url: '/_next/static/chunks/9291.f2fa8bd191056856.js', revision: 'f2fa8bd191056856'},
				{url: '/_next/static/chunks/9382.0ec28414d7b260d3.js', revision: '0ec28414d7b260d3'},
				{url: '/_next/static/chunks/9441.6d7f927c9968e7c0.js', revision: '6d7f927c9968e7c0'},
				{url: '/_next/static/chunks/9519.1084926b27f694ca.js', revision: '1084926b27f694ca'},
				{url: '/_next/static/chunks/9627-3787d1a1ed8d01aa.js', revision: '3787d1a1ed8d01aa'},
				{url: '/_next/static/chunks/9638.a17969e5cfcce52a.js', revision: 'a17969e5cfcce52a'},
				{url: '/_next/static/chunks/9733.9855e59ec3a3f4b7.js', revision: '9855e59ec3a3f4b7'},
				{url: '/_next/static/chunks/9851.e8553fcbf84dde8e.js', revision: 'e8553fcbf84dde8e'},
				{url: '/_next/static/chunks/988.54b153b8c25c948b.js', revision: '54b153b8c25c948b'},
				{url: '/_next/static/chunks/framework-06a5c7f945c292f9.js', revision: '06a5c7f945c292f9'},
				{url: '/_next/static/chunks/main-c634670eda4d759a.js', revision: 'c634670eda4d759a'},
				{url: '/_next/static/chunks/pages/_app-c7887ce570a3d669.js', revision: 'c7887ce570a3d669'},
				{url: '/_next/static/chunks/pages/_error-83f70c7be3775587.js', revision: '83f70c7be3775587'},
				{url: '/_next/static/chunks/pages/apps/address-book-bedf51f9938ff019.js', revision: 'bedf51f9938ff019'},
				{url: '/_next/static/chunks/pages/apps/disperse-777e574ed7b1e2d1.js', revision: '777e574ed7b1e2d1'},
				{url: '/_next/static/chunks/pages/apps/send-e862040bd2e3e193.js', revision: 'e862040bd2e3e193'},
				{url: '/_next/static/chunks/pages/apps/wallet-f6c57ec55065a25a.js', revision: 'f6c57ec55065a25a'},
				{url: '/_next/static/chunks/pages/index-8f4c387847d8b181.js', revision: '8f4c387847d8b181'},
				{
					url: '/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js',
					revision: '837c0df77fd5009c9e46d446188ecfd0'
				},
				{url: '/_next/static/chunks/webpack-d27773bc9ce8c328.js', revision: 'd27773bc9ce8c328'},
				{url: '/_next/static/css/3252b53d164d1a07.css', revision: '3252b53d164d1a07'},
				{url: '/_next/static/media/0596140cb8d9223a-s.woff2', revision: 'ddd5de66d4a7c56eeac6e0b10c5d8521'},
				{url: '/_next/static/media/1a142ec2652f2d06-s.woff2', revision: 'be388d4ee0f6f0e3c704c90545794e2d'},
				{url: '/_next/static/media/1a4dd1d7cd3232ea-s.woff2', revision: '91c6fe4b62b5ebda5ccee3c4aa1eb33d'},
				{url: '/_next/static/media/2053df8159b25386-s.woff2', revision: '89a487243655b1945e8b173e3632e315'},
				{url: '/_next/static/media/341baa6ce7a16e81-s.woff2', revision: '0c7b4bd9156673a090be9999002eaab1'},
				{url: '/_next/static/media/356abdd51b933898-s.woff2', revision: '4ed5a85b9b460c31a44ba541e277bcc0'},
				{url: '/_next/static/media/64ea2a5aaa4dedd3-s.woff2', revision: '9b04ab384e20d8caa6e96f623bdd9a23'},
				{url: '/_next/static/media/891487401855818d-s.woff2', revision: 'c39f8c869c3ce6e1cecf63da09b0c4f4'},
				{url: '/_next/static/media/9d9b9cae20d87d18-s.woff2', revision: '5fd8c4e4408334cab1a4eb5280e70ff1'},
				{url: '/_next/static/media/b63e4df112f8dce1-s.woff2', revision: 'bfd216fcfe1902b6c614806673a86381'},
				{url: '/_next/static/media/c22ccc5eb58b83e1-s.p.woff2', revision: '8a051a2b61e4a766fff21bb106142860'},
				{url: '/_next/static/media/d70c23d6fe66d464-s.woff2', revision: '7abbd25026a8e3994d885bd8704b9588'},
				{url: '/_next/static/media/dba81c1208da12ee-s.p.woff2', revision: '61ad024295cbcb211b4fda1d44905bf9'},
				{url: '/android-icon-192x192.ico', revision: '3522f6114029893bc7adc5421a8c6e95'},
				{url: '/avatar.png', revision: 'b1e48274eb64a241e89ad52fb47e361f'},
				{url: '/cover.jpg', revision: '6a4de244968766fb41290e52f82aa5d9'},
				{url: '/dumpservices.svg', revision: 'eeb91c3a1b9cc194f6a78ae711c990eb'},
				{url: '/favicons/android-icon-144x144.png', revision: 'f84c22abbaf2104f0a15e5fa7ce57b00'},
				{url: '/favicons/android-icon-192x192.png', revision: '511bcb417298d5c1213764a36560b32f'},
				{url: '/favicons/android-icon-36x36.png', revision: '29c6d2e5a169c485bd3c9ff8d507d06a'},
				{url: '/favicons/android-icon-48x48.png', revision: 'ac8a9ab09e2ad7a4a83a8242e368d955'},
				{url: '/favicons/android-icon-72x72.png', revision: '1558ca8274579e2ec3de8656b4fdbadc'},
				{url: '/favicons/android-icon-96x96.png', revision: '087c1fefc4d8c3405ed3f190fde66488'},
				{url: '/favicons/apple-icon-114x114.png', revision: '636830f827e5ef6a7e311ecb194724e8'},
				{url: '/favicons/apple-icon-120x120.png', revision: '927c6b82f4a9b24625a71f2af0d573c3'},
				{url: '/favicons/apple-icon-144x144.png', revision: '3e450ed21f08e365988e1b4204741414'},
				{url: '/favicons/apple-icon-152x152.png', revision: '9679a0904a815021bcc077c896745035'},
				{url: '/favicons/apple-icon-180x180.png', revision: '3c2ff5ee3103cde01363264bdfb5af30'},
				{url: '/favicons/apple-icon-57x57.png', revision: 'e7263b5f6cffc2f8b5eaacb3d1cb923e'},
				{url: '/favicons/apple-icon-60x60.png', revision: '4f8dd5b7c43677ad0d0280fb2da2c717'},
				{url: '/favicons/apple-icon-72x72.png', revision: '553485edb24f1d2dff0475d7cfaaa179'},
				{url: '/favicons/apple-icon-76x76.png', revision: '1a2296d1b48a640ac2573c943afd4521'},
				{url: '/favicons/apple-icon-precomposed.png', revision: 'a5e9655fc315dac613db287d4c8e1b76'},
				{url: '/favicons/apple-icon.png', revision: 'a5e9655fc315dac613db287d4c8e1b76'},
				{url: '/favicons/browserconfig.xml', revision: '653d077300a12f09a69caeea7a8947f8'},
				{url: '/favicons/favicon-16x16.png', revision: '5b3a238a137b1131203647aa86566db6'},
				{url: '/favicons/favicon-32x32.png', revision: '23b4db369271952e5181e4821a4110d2'},
				{url: '/favicons/favicon-96x96.png', revision: 'f28206c4fd55681bc94f5eb988754213'},
				{url: '/favicons/favicon.ico', revision: '4cdcbe3ad9c6ebe78cdc084448c06753'},
				{url: '/favicons/favicon.svg', revision: '6d222efc790057eab4b7861734a9b7c1'},
				{url: '/favicons/manifest.json', revision: 'cedc58bb031b4647806e1dedaffee50e'},
				{url: '/favicons/migratooor.png', revision: 'c4b113e92e2bb184bc38d51d155fbe9a'},
				{url: '/favicons/ms-icon-144x144.png', revision: '3e450ed21f08e365988e1b4204741414'},
				{url: '/favicons/ms-icon-150x150.png', revision: 'b8562b84bdb01e15ac2a9da77851f7d0'},
				{url: '/favicons/ms-icon-310x310.png', revision: '11d6296e7dd481a314efc70319b0bd2c'},
				{url: '/favicons/ms-icon-70x70.png', revision: '3f0ee0a51145090f43afd16ae01f7023'},
				{url: '/hero.jpg', revision: 'cf79e58bc70764bb684a3def9adce41f'},
				{url: '/manifest.json', revision: 'a9d80e671daa9979af521321d9b72d32'},
				{url: '/mouse.svg', revision: '36d721281ddbe025b022ed3dfdc5f681'},
				{url: '/og.png', revision: '6db3b275535fd4ca1668a70b9695c519'},
				{url: '/og_disperse.png', revision: '784c32d2acff860ebe51ee8120f0ffa5'},
				{url: '/og_migratooor.png', revision: 'f1a18c476bb8dade1a82cd8bea7af5ac'},
				{url: '/og_multisafe.png', revision: '326c84f0a57cb17ecaef9a53f754afe9'},
				{url: '/og_tokenlistooor.png', revision: '4ffbb2ea6468d9045af942d00465cd9a'},
				{url: '/placeholder-nft.png', revision: '0a5319ce91d205bd2dbbeb5de2d1dcaa'},
				{url: '/placeholder.png', revision: '76e4abc63869962750bcd60694719807'},
				{url: '/smol.svg', revision: 'a6ca40981fcf964fe5a28761681d39a7'},
				{url: '/token-placeholder.png', revision: '63a4606fa310d550bd5b87e2ffc64658'}
			],
			{ignoreURLParametersMatching: []}
		),
		e.cleanupOutdatedCaches(),
		e.registerRoute(
			'/',
			new e.NetworkFirst({
				cacheName: 'start-url',
				plugins: [
					{
						cacheWillUpdate: async ({request: e, response: c, event: s, state: a}) =>
							c && 'opaqueredirect' === c.type
								? new Response(c.body, {status: 200, statusText: 'OK', headers: c.headers})
								: c
					}
				]
			}),
			'GET'
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
			new e.CacheFirst({
				cacheName: 'google-fonts-webfonts',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 31536e3})]
			}),
			'GET'
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
			new e.StaleWhileRevalidate({
				cacheName: 'google-fonts-stylesheets',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 604800})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-font-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 4, maxAgeSeconds: 604800})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-image-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 64, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\/_next\/image\?url=.+$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'next-image',
				plugins: [new e.ExpirationPlugin({maxEntries: 64, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:mp3|wav|ogg)$/i,
			new e.CacheFirst({
				cacheName: 'static-audio-assets',
				plugins: [new e.RangeRequestsPlugin(), new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:mp4)$/i,
			new e.CacheFirst({
				cacheName: 'static-video-assets',
				plugins: [new e.RangeRequestsPlugin(), new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:js)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-js-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:css|less)$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'static-style-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\/_next\/data\/.+\/.+\.json$/i,
			new e.StaleWhileRevalidate({
				cacheName: 'next-data',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			/\.(?:json|xml|csv)$/i,
			new e.NetworkFirst({
				cacheName: 'static-data-assets',
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => {
				if (!(self.origin === e.origin)) return !1;
				const c = e.pathname;
				return !c.startsWith('/api/auth/') && !!c.startsWith('/api/');
			},
			new e.NetworkFirst({
				cacheName: 'apis',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 16, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => {
				if (!(self.origin === e.origin)) return !1;
				return !e.pathname.startsWith('/api/');
			},
			new e.NetworkFirst({
				cacheName: 'others',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 86400})]
			}),
			'GET'
		),
		e.registerRoute(
			({url: e}) => !(self.origin === e.origin),
			new e.NetworkFirst({
				cacheName: 'cross-origin',
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({maxEntries: 32, maxAgeSeconds: 3600})]
			}),
			'GET'
		);
});