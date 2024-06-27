/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {withPlausibleProxy} = require('next-plausible');

module.exports = withPlausibleProxy({
	scriptName: 'script',
	customDomain: 'https://smold.app'
})(
	withPWA({
		experimental: {
			externalDir: true
		},
		images: {
			domains: [
				'gib.to',
				'rawcdn.githack.com',
				'raw.githubusercontent.com',
				'ipfs.io',
				's3.amazonaws.com',
				'1inch.exchange',
				'hut34.io',
				'www.coingecko.com',
				'defiprime.com',
				'cdn.furucombo.app',
				'gemini.com',
				'messari.io',
				'ethereum-optimism.github.io',
				'tryroll.com',
				'logo.assets.tkn.eth.limo',
				'umaproject.org',
				'cloudflare-ipfs.com',
				'assets.smold.app'
			]
		},
		transpilePackages: ['lib'],

		async rewrites() {
			return [
				{
					source: '/js/script.js',
					destination: 'https://plausible.io/js/script.js'
				},
				{
					source: '/api/event',
					destination: 'https://plausible.io/api/event'
				}
			];
		}
	})
);
