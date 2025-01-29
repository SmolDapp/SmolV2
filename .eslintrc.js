module.exports = {
	root: true,
	env: {
		node: true,
		browser: true,
		es2021: true
	},
	plugins: ['@typescript-eslint', 'react', 'tailwindcss', 'unused-imports', 'import'],
	extends: [
		'prettier',
		'eslint:recommended',
		'plugin:tailwindcss/recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@next/next/recommended',
		'plugin:react-hooks/recommended',
		'plugin:import/recommended',
		'plugin:import/typescript'
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {jsx: true},
		ecmaVersion: 2022,
		sourceType: 'module',
		tsconfigRootDir: __dirname,
		project: ['./tsconfig.json']
	},
	settings: {
		react: {version: 'detect'},
		next: {
			rootDir: './'
		},
		'import/resolver': {
			typescript: {
				project: './tsconfig.json'
			}
		}
	},
	rules: {
		'import/default': 0,
		'react/prop-types': 0,
		'no-async-promise-executor': 0,
		quotes: [2, 'single', {avoidEscape: true}],
		'object-curly-spacing': [2, 'never'],
		'array-bracket-spacing': [2, 'never'],
		semi: 'error',
		'no-else-return': ['error', {allowElseIf: false}],
		'eol-last': ['error', 'always'],
		'import/no-named-as-default-member': 2,
		'tailwindcss/no-custom-classname': 0,
		'array-bracket-newline': ['error', {multiline: true}],
		'react/jsx-curly-brace-presence': ['error', {props: 'always', children: 'always'}],
		'react/jsx-first-prop-new-line': ['error', 'multiline'],
		'react/jsx-closing-tag-location': 2,
		'no-unused-vars': 'error',
		'unused-imports/no-unused-imports': 'error',
		'unused-imports/no-unused-vars': [
			'error',
			{
				vars: 'all',
				varsIgnorePattern: '^_',
				args: 'after-used',
				argsIgnorePattern: '^_'
			}
		],
		'import/first': 2,
		'import/newline-after-import': 2,
		'import/no-duplicates': 2,
		curly: ['error', 'all'],
		'object-curly-newline': [
			'error',
			{
				ObjectExpression: {multiline: true, consistent: true},
				ObjectPattern: {multiline: true, consistent: true},
				ImportDeclaration: {multiline: true, consistent: true},
				ExportDeclaration: {multiline: true, minProperties: 3}
			}
		],
		'object-property-newline': ['error', {allowAllPropertiesOnSameLine: true}],
		'@typescript-eslint/consistent-type-imports': [
			2,
			{
				prefer: 'type-imports',
				disallowTypeAnnotations: true,
				fixStyle: 'separate-type-imports'
			}
		],
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/no-unused-vars': [
			'error',
			{
				vars: 'all',
				varsIgnorePattern: '^_',
				args: 'after-used',
				argsIgnorePattern: '^_'
			}
		],
		'@typescript-eslint/no-explicit-any': [1],
		'@typescript-eslint/array-type': ['error', {default: 'array'}],
		'@typescript-eslint/consistent-type-assertions': 0,
		'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
		'@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
		'@typescript-eslint/explicit-function-return-type': [
			'error',
			{
				allowExpressions: true,
				allowTypedFunctionExpressions: true,
				allowHigherOrderFunctions: false,
				allowDirectConstAssertionInArrowFunctions: false,
				allowConciseArrowFunctionExpressionsStartingWithVoid: false,
				allowedNames: []
			}
		],
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'default',
				format: ['camelCase', 'PascalCase'],
				filter: {
					regex: '^(@typescript-eslint/|react/|react-hooks/|no-|import/|object-|array-|eol-|tailwindcss/|unused-imports/|sort-|newlines-between|brace-style|comma-dangle).*$',
					match: false
				}
			},
			{selector: 'function', format: ['camelCase', 'PascalCase']},

			{selector: 'variableLike', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow'},
			{
				selector: 'variable',
				types: ['boolean'],
				format: ['PascalCase'],
				prefix: ['is', 'are', 'should', 'has', 'can', 'did', 'will', 'with', 'was', 'only']
			},
			{
				selector: 'variableLike',
				format: ['PascalCase'],
				filter: {regex: '(Context)$|(ContextApp)$|^Component$', match: true}
			},
			{selector: ['typeParameter', 'typeAlias'], format: ['PascalCase'], prefix: ['T']},
			{selector: 'interface', format: ['PascalCase'], prefix: ['I']}
		],
		'@typescript-eslint/no-misused-promises': ['error', {checksConditionals: true, checksVoidReturn: false}],
		'@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
		'@typescript-eslint/no-unnecessary-qualifier': 'error',
		'@typescript-eslint/no-unnecessary-type-arguments': 'error',
		'@typescript-eslint/no-unnecessary-boolean-literal-compare': [
			'error',
			{
				allowComparingNullableBooleansToTrue: false,
				allowComparingNullableBooleansToFalse: false
			}
		],
		'@typescript-eslint/prefer-for-of': 'error',
		'@typescript-eslint/prefer-function-type': 'error',
		'@typescript-eslint/prefer-includes': 'error',
		'@typescript-eslint/promise-function-async': 'error',
		'@typescript-eslint/require-array-sort-compare': 'error',
		'brace-style': ['error', '1tbs'],
		// '@typescript-eslint/brace-style': ['error', '1tbs'],
		'comma-dangle': ['error', 'never'],
		// '@typescript-eslint/comma-dangle': ['error'],
		'@typescript-eslint/prefer-optional-chain': 'error',
		indent: 'off',
		'@typescript-eslint/indent': 0,
		'no-multi-spaces': ['error', {ignoreEOLComments: false}],
		'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
		'react/jsx-max-props-per-line': 'off',
		'react-hooks/exhaustive-deps': [
			'warn',
			{
				additionalHooks: '(^useAsyncTrigger$|^useDeepCompareMemo$)'
			}
		],
		'import/no-unresolved': 0, //Issue with package exports
		'sort-imports': [
			'error',
			{
				ignoreCase: false,
				ignoreDeclarationSort: true,
				ignoreMemberSort: false,
				memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
				allowSeparatedGroups: true
			}
		],
		'import/order': [
			'error',
			{
				groups: [
					'builtin', // Built-in imports (come from NodeJS native) go first
					'external', // <- External imports
					'internal', // <- Absolute imports
					['sibling', 'parent'], // <- Relative imports, the sibling and parent types they can be mingled together
					'index', // <- index imports
					'unknown', // <- unknown
					'type' // <- Types go last
				],
				pathGroups: [
					{
						pattern: '@/**',
						group: 'internal'
					}
				],
				'newlines-between': 'always',
				alphabetize: {
					/* sort in ascending order. Options: ["ignore", "asc", "desc"] */
					order: 'asc',
					/* ignore case. Options: [true, false] */
					caseInsensitive: true
				},
				warnOnUnassignedImports: true,
				pathGroupsExcludedImportTypes: ['type']
			}
		],
		'import/consistent-type-specifier-style': ['error', 'prefer-top-level']
	}
};
