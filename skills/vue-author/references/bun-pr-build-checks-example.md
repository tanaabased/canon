# Vue build checks workflow

Use this to check a Vue production build. Keep lint and the production build on pull requests. Adapt the build script to the package.

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
