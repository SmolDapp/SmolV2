/** @type {import('tailwindcss').Config} */
const config = require('../lib/tailwind.config');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	...config,
	content: [
		'./components/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		...config.content
	],
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography'), require('tailwindcss-animate')],
	theme: {
		...config.theme,
		extend: {
			...config.theme.extend,
			fontFamily: {
				aeonik: ['var(--aeonik-font)', 'Aeonik', ...defaultTheme.fontFamily.sans],
				sans: ['var(--aeonik-font)', 'Aeonik', ...defaultTheme.fontFamily.sans],
				mono: ['var(--font-aeonik-mono)', 'Aeonik Mono', ...defaultTheme.fontFamily.mono]
			}
		}
	}
};
