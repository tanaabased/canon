# Bun pull request lint workflow

Use this for the repository lint check. Keep the frozen install and run the same lint command locally and in CI. Adjust the runner and lint script for the repository.

Destination: `.github/workflows/pr-linter.yml`.

```yaml
name: Lint

on:
  pull_request:

permissions:
  contents: read

jobs:
  lint:
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
      # Add a separate `bun run typecheck` step when the repo owns TypeScript.
```
