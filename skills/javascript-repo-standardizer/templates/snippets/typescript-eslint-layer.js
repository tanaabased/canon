import globals from 'globals';
import tseslint from 'typescript-eslint';

export const typescriptLintLayer = tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['test/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
    languageOptions: {
      globals: globals.mocha,
    },
  },
);
