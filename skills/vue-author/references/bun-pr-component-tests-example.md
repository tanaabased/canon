# Vue component test workflow

Use this for Vue packages with component tests. Keep dependency installation and the component test command together. Select the Bun and Node versions used by the package.

Destination: `.github/workflows/pr-component-tests.yml`.

```yaml
name: Component Tests

on:
  pull_request:

permissions:
  contents: read

jobs:
  components:
    runs-on: ubuntu-24.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install Node
        uses: tanaabased/actions/setup-node@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Test components
        run: bun run test:components
```
