import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import pluginQuery from '@tanstack/eslint-plugin-query';
import boundaries from 'eslint-plugin-boundaries';
import isEqPlugin from './eslint-rules/isEqPlugin.js';
import noDirectBitcoinjsLibPlugin from './eslint-rules/noDirectBitcoinjsLibPlugin.js';
import noTanstackUseMutationPlugin from './eslint-rules/noTanstackUseMutationPlugin.js';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/coverage/**',
            '**/.next/**',
            '**/.vercel/**',
            '**/.turbo/**',
            '**/*.log',
            '**/*.js',
            'packages/**/dist/**',
            'apps/**/dist/**',
            'apps/**/build/**'
        ]
    },

    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true }
            }
        },
        plugins: {
            import: importPlugin,
            'unused-imports': unusedImports,
            iseq: isEqPlugin,
            'no-direct-bitcoinjs-lib': noDirectBitcoinjsLibPlugin,
            'no-tanstack-use-mutation': noTanstackUseMutationPlugin,
            boundaries
        },
        settings: {
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx']
            },
            'import/resolver': {
                typescript: {
                    project: [
                        './tsconfig.json',
                        './packages/*/tsconfig.json',
                        './apps/*/*/tsconfig.json'
                    ],
                    alwaysTryTypes: true
                },
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts']
                }
            },
            'boundaries/elements': [
                { type: 'core', pattern: 'packages/core/**/*', mode: 'full' },
                { type: 'ux-shared', pattern: 'packages/ux/src/shared/**/*', mode: 'full' },
                {
                    type: 'ux-entities',
                    pattern: 'packages/ux/src/entities/**/*',
                    mode: 'full'
                },
                {
                    type: 'ux-features',
                    pattern: 'packages/ux/src/features/**/*',
                    mode: 'full'
                },
                { type: 'ux', pattern: 'packages/ux/**/*', mode: 'full' },
                { type: 'sync', pattern: 'packages/sync/**/*', mode: 'full' },
                { type: 'sync-storage', pattern: 'packages/sync-storage/**/*', mode: 'full' },
                { type: 'slottree', pattern: 'packages/slottree/**/*', mode: 'full' },
                {
                    type: 'mobile-app',
                    pattern: 'apps/mobile/src/app/**/*',
                    mode: 'full'
                },
                {
                    type: 'mobile-screens',
                    pattern: 'apps/mobile/src/screens/**/*',
                    mode: 'full'
                },
                {
                    type: 'mobile-features',
                    pattern: 'apps/mobile/src/features/**/*',
                    mode: 'full'
                },
                {
                    type: 'mobile-entities',
                    pattern: 'apps/mobile/src/entities/**/*',
                    mode: 'full'
                },
                {
                    type: 'mobile-shared',
                    pattern: 'apps/mobile/src/shared/**/*',
                    mode: 'full'
                },
                { type: 'mobile', pattern: 'apps/mobile/**/*', mode: 'full' },
                { type: 'web-common', pattern: 'apps/web/common/**/*', mode: 'full' },
                { type: 'web-browser', pattern: 'apps/web/browser/**/*', mode: 'full' }
            ]
        },
        rules: {
            'no-underscore-dangle': 'off',
            'no-plusplus': 'off',
            'class-method-use-this': 'off',
            eqeqeq: ['error', 'smart'],
            complexity: 'error',
            'no-empty': ['error'],
            'no-param-reassign': 'off',
            'no-prototype-builtins': 'off',
            'array-bracket-spacing': ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
            'max-classes-per-file': 'off',
            radix: ['error', 'as-needed'],
            'no-return-assign': 'off',
            'no-restricted-syntax': ['error', 'LabeledStatement', 'WithStatement'],
            'no-console': 'error',

            /* imports */
            'import/extensions': 'off',
            'no-restricted-imports': 'off', // Using @typescript-eslint/no-restricted-imports instead
            'import/prefer-default-export': 'off',
            'import/no-extraneous-dependencies': ['error', { peerDependencies: true }],
            'import/order': [
                'error',
                {
                    groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
                    pathGroups: [
                        {
                            pattern: '@safely/**',
                            group: 'internal',
                            position: 'before'
                        },
                        {
                            pattern: '@mobile/**',
                            group: 'internal',
                            position: 'after'
                        }
                    ],
                    pathGroupsExcludedImportTypes: ['builtin'],
                    'newlines-between': 'always',
                    alphabetize: { order: 'asc', caseInsensitive: true }
                }
            ],

            /* unused-imports */
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    vars: 'all',
                    args: 'all',
                    ignoreRestSiblings: false,
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],

            /* typescript */
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'enumMember',
                    format: ['UPPER_CASE']
                }
            ],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        constructors: 'no-public',
                        methods: 'explicit',
                        accessors: 'explicit',
                        properties: 'explicit'
                    }
                }
            ],
            '@typescript-eslint/prefer-readonly': 'error',
            '@typescript-eslint/dot-notation': 'error',
            'comma-dangle': ['error', 'never'],
            '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
            '@typescript-eslint/no-shadow': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-redeclare': ['error', { ignoreDeclarationMerge: true }],
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            /* custom */
            'iseq/no-strict-eq-when-isEq': 'error',
            'no-direct-bitcoinjs-lib/no-direct-bitcoinjs-lib': 'error',
            'no-tanstack-use-mutation/no-tanstack-use-mutation': 'error',

            /* FSD layering inside @safely/ux: shared cannot import entities/features;
               entities cannot import features. */
            'boundaries/element-types': [
                'error',
                {
                    default: 'allow',
                    rules: [
                        {
                            from: 'ux-shared',
                            disallow: ['ux-entities', 'ux-features']
                        },
                        {
                            from: 'ux-entities',
                            disallow: ['ux-features']
                        },
                        {
                            from: 'mobile-shared',
                            disallow: [
                                'mobile-entities',
                                'mobile-features',
                                'mobile-screens',
                                'mobile-app'
                            ]
                        },
                        {
                            from: 'mobile-entities',
                            disallow: ['mobile-features', 'mobile-screens', 'mobile-app']
                        },
                        {
                            from: 'mobile-features',
                            disallow: ['mobile-screens', 'mobile-app']
                        },
                        {
                            from: 'mobile-screens',
                            disallow: ['mobile-app']
                        }
                    ]
                }
            ]
        }
    },
    /* React */
    {
        files: ['**/*.jsx', '**/*.tsx'],
        ...react.configs.flat.recommended,
        plugins: {
            react,
            'react-hooks': reactHooks
        },
        settings: {
            react: { version: 'detect' }
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
            'react/display-name': 'off',
            'react/prop-types': 'off'
        }
    },

    /* React Query */
    {
        plugins: {
            '@tanstack/query': pluginQuery
        },
        rules: {
            '@tanstack/query/exhaustive-deps': 'off'
        }
    },

    /* prettier */
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: { prettier: prettierPlugin },
        rules: {
            'prettier/prettier': 'error'
        }
    },
    /* NOTE: forbid any import cycles inside the package.
     *
     * Why this matters: many of our modules call utilities at module-load time
     * (e.g. "defineQueryKeys(...)" evaluated inside "keys.ts" files at import).
     * If a cycle exists, the importer sees a half-evaluated module — the
     * exported binding is still "undefined". Calling it throws
     * "X is not a function" and crashes the whole app on startup.
     *
     * "import/no-cycle" doesn't support a custom message — if it fires, the
     * default trace shows the cycle path; fix the cycle, don't suppress.
     */
    {
        files: [
            'packages/ux/**/*.ts',
            'packages/ux/**/*.tsx',
            'packages/core/**/*.ts',
            'packages/core/**/*.tsx',
            'packages/sync-storage/**/*.ts',
            'packages/sync/**/*.ts',
            'packages/slottree/**/*.ts',
            'apps/mobile/src/**/*.ts',
            'apps/mobile/src/**/*.tsx'
        ],
        rules: {
            'import/no-cycle': ['error', { maxDepth: 10, ignoreExternal: true }],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
            ],
            '@typescript-eslint/no-import-type-side-effects': 'error'
        }
    },
    /* logger implementations — console is the last-resort fallback */
    {
        files: ['apps/mobile/src/shared/logger/**/*.ts', 'packages/sync/src/logger/**/*.ts'],
        rules: {
            'no-console': 'off'
        }
    },
    /* tests */
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
        rules: {
            'no-console': 'off'
        }
    },
    eslintConfigPrettier
];
