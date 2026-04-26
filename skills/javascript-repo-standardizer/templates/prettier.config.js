export default {
  printWidth: 100,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'always',
  bracketSpacing: true,
  proseWrap: 'preserve',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['.vitepress/**/*.{js,mjs,cjs,ts}'],
      options: {
        printWidth: 140,
        objectWrap: 'collapse',
      },
    },
  ],
};
