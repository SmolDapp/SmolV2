const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});

module.exports = withPWA({
	experimental: {
		externalDir: true
	},
	images: {
		domains: ['rawcdn.githack.com', 'raw.githubusercontent.com', 'assets.smold.app']
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
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
		INFURA_PROJECT_ID: process.env.INFURA_PROJECT_ID,
		SMOL_ASSETS_URL: 'https://assets.smold.app/api',

		// Wallet Connect modal configuration
		WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
		WALLETCONNECT_PROJECT_NAME: 'Smol',
		WALLETCONNECT_PROJECT_DESCRIPTION:
			'Simple, smart and elegant dapps, designed to make your crypto journey a little bit easier.',
		WALLETCONNECT_PROJECT_URL: 'https://smold.app',
		WALLETCONNECT_PROJECT_ICON: 'https://smold.app/favicons/ms-icon-310x310.png',
		RECEIVER_ADDRESS: '0x10001192576E8079f12d6695b0948C2F41320040'
	}
});
