import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import boundaries from 'eslint-plugin-boundaries';
import isEqPlugin from './eslint-rules/isEqPlugin.js';

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
                { type: 'ux', pattern: 'packages/ux/**/*', mode: 'full' },
                { type: 'sync', pattern: 'packages/sync/**/*', mode: 'full' },
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
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error', 'info', 'log']
                }
            ],

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
                            pattern: '@tonkeeper/**',
                            group: 'internal',
                            position: 'before'
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
    /* prettier */
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: { prettier: prettierPlugin },
        rules: {
            'prettier/prettier': 'error'
        }
    },
    eslintConfigPrettier
];