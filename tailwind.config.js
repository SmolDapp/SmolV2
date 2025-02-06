/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
		'./common/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./utils/**/*.{js,ts,jsx,tsx}',
		'./types/**/*.{js,ts,jsx,tsx}',
		'./primitives/**/*.{js,ts,jsx,tsx}',
		'./icons/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		colors: {
			black: 'hsl(0, 0%, 0%)',
			white: 'rgb(255, 255, 255)',
			transparent: 'transparent',
			inherit: 'inherit',
			primary: '#FFD915',
			primaryHover: '#FFE043',
			neutral: {
				0: '#FFFFFF',
				100: '#F9F9F9',
				200: '#F7F7F7',
				300: '#F3F3F3',
				400: '#DCDDDD',
				500: '#ADB1BD',
				600: '#ADB1BD',
				700: '#474F59',
				800: '#272B30',
				900: '#060B11'
			},
			grey: {
				0: '#FFFFFF',
				100: '#F2F9FF',
				200: '#E3F2FE',
				300: '#9ED3FB',
				400: '#85C6F7',
				500: '#6FB5F9',
				600: '#339BFF',
				700: '#8AA9C1',
				800: '#2A5A7E',
				900: '#09121A'
			},
			red: '#D42600',
			green: '#0C9000'
		},
		extend: {
			fontFamily: {
				sans: ['var(--rubik-font)', 'Rubik', 'Roboto', ...defaultTheme.fontFamily.sans],
				mono: ['var(--scp-font)', 'Source Code Pro', ...defaultTheme.fontFamily.mono]
			},
			screens: {
				xl: '1440px'
			},
			height: {
				content: '656px',
				app: 'calc(100dvh - 80px)',
				108: '432px'
			},
			minHeight: {
				content: '656px',
				app: 'calc(100dvh - 80px)'
			},
			width: {
				inherit: 'inherit',
				sidebar: '280px',
				main: '1000px',
				22: '88px',
				108: '432px',
				123: '492px'
			},
			maxWidth: {
				'4xl': '888px',
				'5xl': '992px',
				'6xl': '1200px',
				22: '88px',
				108: '432px',
				123: '492px'
			},
			fontSize: {
				xxs: ['10px', '16px'],
				xs: ['12px', '16px'],
				sm: ['14px', '20px'],
				base: ['16px', '24px'],
				intermediate: ['18px', '24px'],
				lg: ['20px', '32px'],
				xl: ['24px', '32px'],
				'3xl': ['32px', '40px'],
				'4xl': ['40px', '48px']
			},
			gridTemplateColumns: {
				root: 'repeat(30, minmax(0, 1fr))'
			},
			gridColumn: {
				sidebar: 'span 7 / span 7',
				main: 'span 23 / span 23'
			},
			borderRadius: {
				'4xl': '40px',
				'5xl': '48px'
			}
		},
		plugins: [
			require('@tailwindcss/forms'),
			require('@tailwindcss/typography'),
			require('tailwindcss-animate'),
			plugin(function ({addUtilities}) {
				addUtilities({
					'.scrollbar-none': {
						'-ms-overflow-style': 'none',
						'scrollbar-width': 'none',
						'&::-webkit-scrollbar': {
							display: 'none'
						}
					}
				});
			})
		]
	}
};
