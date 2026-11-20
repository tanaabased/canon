# VitePress build checks workflow

Use this workflow to validate a VitePress site in a pull request. Keep the repository lint command and build the documentation from the candidate checkout so broken site imports and links surface in CI.

For a standalone site, `build-command: bun run build` can call the site's normal production build. For a package with a companion site, point it at the docs-specific script, such as `bun run build:docs`, and let that script select the documentation root. If the site imports generated package output, prepare that output before the site build. A successful build still needs a focused page check when a change affects navigation or interactive behavior.

Destination: `.github/workflows/pr-build-checks.yml`.

```yaml
name: Build Checks

on:
  pull_request:

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Run lint checks
        run: bun run lint
      - name: Build documentation
        uses: tanaabased/actions/vitepress-build-check@v1
        with:
          build-command: bun run build
```
