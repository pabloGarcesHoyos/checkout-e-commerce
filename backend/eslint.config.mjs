// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['test/**/*.e2e-spec.ts'],
    rules: {
      // supertest's `response.body` is untyped `any` by design; asserting on it
      // in e2e tests is the normal pattern and not a real type-safety gap.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      // jest.fn()-based mocks read as "unbound methods" to this rule, and
      // `jest.Mock.mock.calls` indexing is untyped `any[]` by design.
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
);
