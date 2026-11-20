# Vue component test workflow

Use this workflow to run Vue component behavior tests with the repository's configured Vitest suite. Bun installs dependencies from the lockfile. The example also sets up Node because the component test script launches Vitest with Node.

For an established suite, keep its working test configuration and select the script that runs it once in CI. For a new suite, use Vue Test Utils and a DOM environment to exercise public props, slots, events and interactions. Add a browser scenario only for a behavior the mounted component cannot exercise, such as a real browser layout dependency.

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
