# Bun unit test workflow

Use this workflow for direct tests that can run from a frozen dependency install. Set the final command to the repository script that exercises units and bounded components. An OpenClaw plugin can supply fake SDK contexts here and exercise installation separately with Leia.

Use the Ubuntu and macOS matrix for developer tooling that runs on both platforms. A Linux-only service can use its supported runner directly. Add a Windows runner when the project maintains Windows CI. Keep each supported platform visible as a separate check so one failure identifies the affected environment.

Destination: `.github/workflows/pr-unit-tests.yml`.

```yaml
name: Unit Tests

on:
  pull_request:

permissions:
  contents: read

jobs:
  unit-tests:
    name: ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os:
          - ubuntu-24.04
          - macos-26
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Run unit tests
        run: bun run test
```
