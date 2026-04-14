# JavaScript Lint and Format Baseline

Use this baseline when standardizing a repository around one Bun-first lint and format shape for JavaScript and Bun repos.

## Files

- `eslint.config.js`: shared Bun/ESM ESLint baseline for `.js`, `.mjs`, `.cjs`, and Mocha-style tests
- `prettier.config.js`: canonical standalone Prettier config used by editor, CI, and CLI formatting
- `.prettierignore`: canonical generated-file ignore list for `prettier . --check` or `--write`
- `snippets/typescript-eslint-layer.js`: optional TypeScript ESLint layer
- `snippets/vue-eslint-layer.js`: optional Vue ESLint layer

Copy these files together when standardizing a repo. If a repo already has lint or format config, align it to these files rather than inventing a separate local formatting baseline.

## Baseline Rules

- Use flat ESLint config at the repo root.
- Keep ESLint and Prettier ownership separate: ESLint handles code-quality and static-analysis rules, while Prettier handles formatting.
- Run Prettier with `prettier --check` or `prettier --write` instead of routing formatting through ESLint.
- Use one shared JS/Bun base, then add narrow overrides for CJS, tests, templates, TS, or Vue only when the repo actually needs them.
- Prefer `eslint-config-prettier` over `eslint-plugin-prettier` for shared repo defaults.
- Prefer `.js` config filenames in ESM repos; only fall back to `.mjs` when the repo cannot mark itself as ESM.
- Keep `node:` protocol usage and ESM defaults consistent across Bun repos.
- Treat `prettier.config.js` in this baseline as the formatting authority for shared repo defaults, including quote style.
- Keep the shared Prettier baseline at `printWidth: 100`, `semi: true`, `singleQuote: true`, `trailingComma: 'all'`, `arrowParens: 'always'`, `bracketSpacing: true`, `proseWrap: 'preserve'`, and `endOfLine: 'lf'`.
- Add a `.vitepress/**/*.{js,mjs,cjs,ts}` Prettier override with `printWidth: 140` and `objectWrap: 'collapse'` to keep VitePress config objects and `head` arrays more compact without widening the repo-wide formatting baseline.
- Treat `objectWrap: 'collapse'` as a modern Prettier 3.x behavior that helps objects stay compact when they fit within the wider VitePress-specific print width.
- The shared ESLint 10 base intentionally avoids `eslint-plugin-import` until that package declares ESLint 10 support.

## Expected Scripts

```json
{
  "scripts": {
    "lint:eslint": "eslint .",
    "format:check": "prettier . --check --ignore-unknown",
    "format:write": "prettier . --write --ignore-unknown",
    "lint": "bun run lint:eslint && bun run format:check"
  }
}
```

Use this shape by default when standardizing a repo. If an existing repo already exposes equivalent scripts, keep the names aligned unless there is a strong repo-specific reason not to.

## Optional Layers

- Add the TypeScript layer only when the repo actually lints `.ts` or `.tsx`.
- Add the Vue layer only when the repo lints `.vue` files.
- Keep docs-site or VitePress repos on the same ESLint base and only append the Vue layer where `.vue` files are present.
