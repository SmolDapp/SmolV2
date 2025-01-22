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
		redirects() {
			return [
				{source: '/migratooor', destination: '/send', permanent: true},
				{source: '/safe', destination: '/multisafe', permanent: true},
				{source: '/stream', destination: 'https://v1.smold.app/stream', permanent: false},
				{
					source: '/',
					has: [{type: 'host', value: 'multisafe.app'}],
					destination: '/multisafe',
					permanent: true
				},
				{
					source: '/',
					has: [{type: 'host', value: 'tokenlistooor.com'}],
					destination: '/tokenlistooor',
					permanent: true
				},
				{
					source: '/',
					has: [{type: 'host', value: 'disperse.smold.app'}],
					destination: '/disperse',
					permanent: true
				},
				{
					source: '/',
					has: [
						{type: 'host', value: 'nftmigratooor.smold.app'},
						{type: 'host', value: 'migratooor.com'},
						{type: 'host', value: 'migrate.smold.app'},
						{type: 'host', value: 'migratooor.smold.app'}
					],
					destination: '/send',
					permanent: true
				},
				{
					source: '/github',
					destination: 'https://github.com/SmolDapp/smoldapp',
					permanent: true
				}
			];
		},
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
		},
		env: {
			PROJECT_SLUG: 'smoldapp',
			RPC_URI_FOR: {
				/**********************************************************************************
				 ** New RPC Setup for mainnet networks
				 *********************************************************************************/
				1: process.env.RPC_URI_FOR_1,
				10: process.env.RPC_URI_FOR_10,
				56: process.env.RPC_URI_FOR_56,
				100: process.env.RPC_URI_FOR_100,
				137: process.env.RPC_URI_FOR_137,
				250: process.env.RPC_URI_FOR_250,
				252: process.env.RPC_URI_FOR_252,
				288: process.env.RPC_URI_FOR_288,
				8453: process.env.RPC_URI_FOR_8453,
				42161: process.env.RPC_URI_FOR_42161,
				42170: process.env.RPC_URI_FOR_42170,
				56288: process.env.RPC_URI_FOR_56288,
				81457: process.env.RPC_URI_FOR_81457,
				111188: process.env.RPC_URI_FOR_111188,

				/**********************************************************************************
				 ** New RPC Setup for testnet networks
				 *********************************************************************************/
				97: process.env.RPC_URL_BINANCE_TESTNET,
				400: process.env.RPC_URL_OPTIMISM_GOERLI,
				2522: process.env.RPC_URI_FOR_2522,
				9728: process.env.RPC_URI_FOR_9728,
				17000: process.env.RPC_URI_FOR_17000,
				18233: process.env.RPC_URI_FOR_18233,
				28882: process.env.RPC_URI_FOR_28882,
				80001: process.env.RPC_URI_FOR_80001,
				84532: process.env.RPC_URI_FOR_84532,
				421614: process.env.RPC_URI_FOR_421614,
				11155111: process.env.RPC_URI_FOR_11155111,
				11155420: process.env.RPC_URI_FOR_11155420
			},
			/**********************************************************************************
			 ** Legacy RPC configuration, mainnet and testnet
			 *********************************************************************************/
			JSON_RPC_URL: {
				1: process.env.RPC_URI_FOR_1,
				10: process.env.RPC_URI_FOR_10,
				56: process.env.RPC_URI_FOR_56,
				97: process.env.RPC_URL_FOR_97,
				137: process.env.RPC_URL_FOR_137,
				250: process.env.RPC_URL_FOR_250,
				420: process.env.RPC_URL_FOR_420,
				8453: process.env.RPC_URL_FOR_8453,
				80001: process.env.RPC_URL_FOR_80001,
				42161: process.env.RPC_URL_FOR_42161,
				11155111: process.env.RPC_URL_FOR_11155111
			},
			/**********************************************************************************
			 ** Wallet Connect configuration
			 *********************************************************************************/
			WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
			WALLETCONNECT_PROJECT_NAME: 'Smol',
			WALLETCONNECT_PROJECT_DESCRIPTION:
				'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.',
			WALLETCONNECT_PROJECT_URL: 'https://smold.app',
			WALLETCONNECT_PROJECT_ICON: 'https://smold.app/favicons/ms-icon-310x310.png',

			SHOULD_USE_FORKNET: process.env.SHOULD_USE_FORKNET === 'true',

			SMOL_ASSETS_URL: 'https://assets.smold.app/api',
			SMOL_ADDRESS: '0x10001192576E8079f12d6695b0948C2F41320040',
			SMOL_ADDRESS_V2: '0x200010672cDB08a33547fA9C0372f622dfDAEB40',
			PLAUSIBLE_DOMAIN: 'smold.app'
		}
	})
);
