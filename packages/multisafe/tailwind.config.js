const plugin = require('tailwindcss/plugin');
const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
	content: [
		'./components/**/*.{js,ts,jsx,tsx}',
		'./components/**/**/*.{js,ts,jsx,tsx}',
		'./contexts/**/*.{js,ts,jsx,tsx}',
		'./hooks/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}'
	],
	theme: {
		colors: {
			black: 'hsl(0, 0%, 0%)',
			white: 'rgb(255, 255, 255)',
			transparent: 'transparent',
			inherit: 'inherit',
			primary: '#FFD915',
			primaryHover: '#FFE043',
			orange: {
				50: '#fff7ed',
				100: '#ffedd5',
				200: '#fed7aa',
				300: '#fdba74',
				400: '#fb923c',
				500: '#f97316',
				600: '#ea580c',
				700: '#c2410c',
				800: '#9a3412',
				900: '#7c2d12',
				950: '#431407'
			},
			neutral: {
				0: '#FFFFFF',
				// 50: '', unavailable
				100: '#FAFAFA',
				200: '#F7F7F7',
				300: '#F3F3F3',
				400: '#DCDDDD',
				500: '#ADB1BD',
				600: '#ADB1BD',
				700: '#474F59',
				800: '#272B30',
				900: '#060B11'
			},
			pink: colors.pink,
			red: colors.rose,
			green: colors.emerald,
			blue: colors.blue,
			teal: colors.teal
		},
		extend: {
			fontFamily: {
				sans: ['var(--inter-font)', 'Inter', 'Roboto', ...defaultTheme.fontFamily.sans],
				mono: ['Source Code Pro', ...defaultTheme.fontFamily.mono]
			},
			width: {
				inherit: 'inherit'
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
				'4xl': ['40px', '56px'],
				'7xl': ['80px', '96px']
			},
			maxWidth: {
				xl: '552px',
				'4xl': '904px',
				'6xl': '1200px'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
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
};
