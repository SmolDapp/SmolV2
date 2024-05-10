/** @type {import('tailwindcss').Config} */
const config = require('../lib/tailwind.config');

module.exports = {
	...config,
	content: [
		...config.content,
		'./components/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		'../lib/common/**/*.{js,ts,jsx,tsx}',
		'../lib/icons/**/*.{js,ts,jsx,tsx}',
		'../lib/primities/**/*.{js,ts,jsx,tsx}',
		'../lib/types/**/*.{js,ts,jsx,tsx}',
		'../lib/utils/**/*.{js,ts,jsx,tsx}'
	],
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('tailwindcss-animate')]
};
