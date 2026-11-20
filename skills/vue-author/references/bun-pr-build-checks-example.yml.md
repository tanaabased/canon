# Vue build checks workflow

Use this workflow to catch production build failures in a Vue project. Keep lint and the build on pull requests, and select the build command by what the repository ships.

For an application, run its normal Vite production build. For a component library, run the package build that produces the public entrypoints and styles. If the repository also ships a docs site, run its distinct docs build against the component package. Mounted interaction tests belong in the component-test workflow; imports or exports from the published package are exercised against a prepared tarball.

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
      - name: Build
        run: bun run build
```
