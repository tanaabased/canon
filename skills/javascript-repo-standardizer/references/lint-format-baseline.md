# JavaScript and TypeScript Lint and Format Baseline

Use this baseline when standardizing a repository around one Bun-first lint and format shape for JavaScript, TypeScript, and Bun repos.

## Files

- `eslint.config.js`: shared Bun/ESM ESLint baseline for `.js`, `.mjs`, `.cjs`, and Mocha-style tests
- `prettier.config.js`: canonical standalone Prettier config used by editor, CI, and CLI formatting
- `.prettierignore`: canonical generated-file ignore list for `prettier . --check` or `--write`
- `snippets/typescript-eslint-layer.js`: optional TypeScript ESLint layer
- `tsconfig.json`: conditional Bun-compatible TypeScript baseline
- `snippets/vue-eslint-layer.js`: optional Vue ESLint layer

Copy the ESLint, Prettier, and ignore base files together when standardizing a repo. Add the TypeScript or Vue files only when that layer applies. If a repo already has lint or format config, align it to these files rather than inventing a separate local formatting baseline.

## Baseline Drift Checklist

Report each missing item as baseline drift instead of treating this reference as an optional recommendation:

- files: `eslint.config.js`, `prettier.config.js`, and `.prettierignore`
- scripts: `lint:eslint`, `format:check`, `format:write`, and the composed `lint`
- development dependencies: `@eslint/js`, `eslint`, `eslint-config-prettier`, `globals`, and `prettier`
- Bun metadata: `packageManager`, `.bun-version`, and a committed `bun.lock`

When a selected layer imports more packages, report those packages too. The Vue layer requires `eslint-plugin-vue` and `vue-eslint-parser`.

When the repo owns `.ts` or `.tsx` source, excluding generated output, vendored code, and documentation templates, also report these missing items as drift:

- file: `tsconfig.json`
- script: `typecheck` using `tsc --noEmit`
- development dependencies: `typescript`, `typescript-eslint`, and `@types/bun`
- the TypeScript ESLint layer for `.ts` and `.tsx`
- test discovery that includes `.spec.ts` when the repo owns TypeScript tests

## Baseline Rules

- Use flat ESLint config at the repo root.
- Keep ESLint and Prettier ownership separate: ESLint handles code-quality and static-analysis rules, while Prettier handles formatting.
- Run Prettier with `prettier --check` or `prettier --write` instead of routing formatting through ESLint.
- Use one shared JS/TS/Bun base, then add narrow overrides for CJS, tests, templates, TS, or Vue only when the repo actually needs them.
- Keep `typecheck` separate from `lint`; a successful Bun execution or build does not replace static type validation.
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

When the repo owns TypeScript source, add this separate script without composing it into `lint`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

## Optional Layers

- Add the TypeScript layer and [the bundled `tsconfig.json`](../templates/tsconfig.json) when the repo owns `.ts` or `.tsx` source.
- Keep the initial TypeScript ESLint layer on the non-type-aware recommended rules. Defer type-aware presets until a repo deliberately accepts their additional analysis cost.
- Add the Vue layer only when the repo lints `.vue` files.
- Keep `eslint-config-prettier` after the Vue recommended layer so Vue formatting rules do not override the standalone Prettier contract.
- Keep docs-site or VitePress repos on the same ESLint base and only append the Vue layer where `.vue` files are present.
