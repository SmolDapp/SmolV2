/* eslint-disable @typescript-eslint/explicit-function-return-type */
const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
	content: [
		'../lib/icons/**/*.{js,jsx,ts,tsx}',
		'../lib/common/**/*.{js,jsx,ts,tsx}',
		'../lib/primitives/**/*.{js,jsx,ts,tsx}',
		'../lib/types/**/*.{js,jsx,ts,tsx}',
		'../lib/utils/**/*.{js,jsx,ts,tsx}'
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
			red: '#D42600',
			green: '#0C9000'
		},
		extend: {
			fontFamily: {
				sans: ['var(--rubik-font)', 'Rubik', 'Roboto', ...defaultTheme.fontFamily.sans],
				mono: ['var(--scp-font)', 'Source Code Pro', ...defaultTheme.fontFamily.mono]
			},
			height: {
				content: '656px',
				app: 'calc(100dvh - 80px)'
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
				108: '432px'
			},
			maxWidth: {
				'4xl': '888px',
				'5xl': '992px',
				'6xl': '1200px',
				22: '88px',
				108: '432px'
			},
			fontSize: {
				xxs: ['10px', '16px'],
				xs: ['12px', '16px'],
				sm: ['14px', '20px'],
				base: ['16px', '24px'],
				intermediate: ['18px', '24px'],
				lg: ['20px', '32px'],
				xl: ['24px', '32px'],
				'3xl': ['32px', '40px']
			},
			gridTemplateColumns: {
				root: 'repeat(30, minmax(0, 1fr))'
			},
			gridColumn: {
				sidebar: 'span 7 / span 7',
				main: 'span 23 / span 23'
			},
			animation: {
				enter: 'enter 200ms ease-out',
				'slide-in': 'slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)',
				leave: 'leave 150ms ease-in forwards'
			},
			keyframes: {
				enter: {
					'0%': {transform: 'scale(0.9)', opacity: 0},
					'100%': {transform: 'scale(1)', opacity: 1}
				},
				leave: {
					'0%': {transform: 'scale(1)', opacity: 1},
					'100%': {transform: 'scale(0.9)', opacity: 0}
				},
				'slide-in': {
					'0%': {transform: 'translateY(-100%)'},
					'100%': {transform: 'translateY(0)'}
				}
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
