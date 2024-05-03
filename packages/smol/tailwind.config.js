const defaultConfig = require('../lib/tailwind.config');

module.exports = {
	content: [
		...defaultConfig.content,
		'./components/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		...defaultConfig.theme
	},
	plugins: [...defaultConfig.plugins]
};
