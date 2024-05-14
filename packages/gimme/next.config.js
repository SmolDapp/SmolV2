/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {PHASE_EXPORT} = require('next/constants');

module.exports = phase =>
	withPWA({
		experimental: {
			externalDir: true
		},
		assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
		images: {
			remotePatterns: [
				{
					protocol: 'https',
					hostname: 'rawcdn.githack.com'
				},
				{
					protocol: 'https',
					hostname: 'raw.githubusercontent.com'
				},
				{
					protocol: 'https',
					hostname: 'assets.smold.app'
				}
			]
		},
		transpilePackages: ['lib'],
		redirects() {
			return [
				{
					source: '/github',
					destination: 'https://github.com/BuiltByMom/LookMom',
					permanent: true
				},
				{
					source: '/',
					destination: '/earn',
					permanent: true
				}
			];
		},
		env: {
			PROJECT_SLUG: 'build_by_mom',
			JSON_RPC_URL: {
				1: process.env.RPC_URL_MAINNET,
				10: process.env.RPC_URL_OPTIMISM,
				137: process.env.RPC_URL_POLYGON,
				250: process.env.RPC_URL_FANTOM,
				1337: 'http://localhost:8080',
				42161: process.env.RPC_URL_ARBITRUM
			},
			YDAEMON_BASE_URI: process.env.YDAEMON_BASE_URI,
			ALCHEMY_KEY: process.env.ALCHEMY_KEY,
			INFURA_KEY: process.env.INFURA_KEY,
			WALLETCONNECT_PROJECT_ID: process.env.WALLETCONNECT_PROJECT_ID,
			SMOL_ASSETS_URL: 'https://assets.smold.app/api'
		}
	});
