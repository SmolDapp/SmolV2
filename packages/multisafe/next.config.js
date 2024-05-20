/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {PHASE_EXPORT} = require('next/constants');
const {withPlausibleProxy} = require('next-plausible');

module.exports = phase =>
	withPlausibleProxy({
		scriptName: 'script',
		customDomain: 'https://smold.app'
	})(
		withPWA({
			experimental: {
				externalDir: true
			},
			assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
			images: {
				unoptimized: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT,
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
					{
						source: '/safe',
						destination: '/',
						permanent: true
					},
					{
						source: '/github',
						destination: 'https://github.com/SmolDapp/SmolV2',
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
				/**********************************************************************************
				 ** New RPC Setup for mainnet networks
				 *********************************************************************************/
				RPC_URI_FOR_1: process.env.RPC_URI_FOR_1,
				RPC_URI_FOR_10: process.env.RPC_URI_FOR_10,
				RPC_URI_FOR_56: process.env.RPC_URL_BINANCE,
				RPC_URI_FOR_137: process.env.RPC_URI_FOR_137,
				RPC_URI_FOR_250: process.env.RPC_URI_FOR_250,
				RPC_URI_FOR_252: process.env.RPC_URI_FOR_252,
				RPC_URI_FOR_288: process.env.RPC_URI_FOR_288,
				RPC_URI_FOR_8453: process.env.RPC_URI_FOR_8453,
				RPC_URI_FOR_42161: process.env.RPC_URI_FOR_42161,
				RPC_URI_FOR_42170: process.env.RPC_URI_FOR_42170,
				RPC_URI_FOR_56288: process.env.RPC_URI_FOR_56288,
				RPC_URI_FOR_81457: process.env.RPC_URI_FOR_81457,
				RPC_URI_FOR_111188: process.env.RPC_URI_FOR_111188,

				/**********************************************************************************
				 ** New RPC Setup for testnet networks
				 *********************************************************************************/
				RPC_URI_FOR_97: process.env.RPC_URL_BINANCE_TESTNET,
				RPC_URI_FOR_400: process.env.RPC_URL_OPTIMISM_GOERLI,
				RPC_URI_FOR_2522: process.env.RPC_URI_FOR_2522,
				RPC_URI_FOR_9728: process.env.RPC_URI_FOR_9728,
				RPC_URI_FOR_17000: process.env.RPC_URI_FOR_17000,
				RPC_URI_FOR_18233: process.env.RPC_URI_FOR_18233,
				RPC_URI_FOR_28882: process.env.RPC_URI_FOR_28882,
				RPC_URI_FOR_80001: process.env.RPC_URI_FOR_80001,
				RPC_URI_FOR_84532: process.env.RPC_URI_FOR_84532,
				RPC_URI_FOR_421614: process.env.RPC_URI_FOR_421614,
				RPC_URI_FOR_11155111: process.env.RPC_URI_FOR_11155111,
				RPC_URI_FOR_11155420: process.env.RPC_URI_FOR_11155420,

				/**********************************************************************************
				 ** Legacy RPC configuration, mainnet and testnet
				 *********************************************************************************/
				JSON_RPC_URL: {
					1: process.env.RPC_URL_MAINNET,
					10: process.env.RPC_URL_OPTIMISM,
					56: process.env.RPC_URL_BINANCE,
					97: process.env.RPC_URL_BINANCE_TESTNET,
					137: process.env.RPC_URL_POLYGON,
					250: process.env.RPC_URL_FANTOM,
					420: process.env.RPC_URL_OPTIMISM_GOERLI,
					8453: process.env.RPC_URL_BASE,
					80001: process.env.RPC_URL_POLYGON_TESTNET,
					42161: process.env.RPC_URL_ARBITRUM,
					11155111: process.env.RPC_URL_SEPOLIA
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
