# Leia examples workflow

Use this workflow for an installed behavior that a unit test cannot exercise. Each matrix entry names a real `examples/<scenario>/README.md`. Choose the preparation step according to what that scenario runs.

- **JavaScript CLI:** build the distributed entrypoint, put its directory on `PATH`, and invoke the command by its installed name. A script distributed directly can be staged with its executable bit intact.
- **Shell CLI:** stage the shipped script or wrapper. Replace the sample version-stamping command with the project's actual release step if the scenario checks a stamped version. Select a runner with the shells the CLI promises to support.
- **OpenClaw plugin:** pack the candidate, select the supported host version, and give the scenario an isolated profile and the tarball path. A plugin-install scenario consumes that tarball and can omit the CLI-specific `dist/` path and script stamp.

Set `shell` to the interpreter for the scenario blocks. Keep retries at zero for deterministic assertions, and enable stdin when the scenario exercises it.

Destination: `.github/workflows/pr-examples-tests.yml`.

```yaml
name: Example Tests

on:
  pull_request:

permissions:
  contents: read

jobs:
  examples:
    name: ${{ matrix.example }}
    runs-on: macos-26
    strategy:
      fail-fast: false
      matrix:
        example:
          - example-name
    steps:
      - name: Checkout code
        uses: actions/checkout@v7
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Prepare release-shaped build
        shell: bash
        run: |
          # Replace this with the repo's real build or dist-prep step.
          # Do not swap in a local stub when the example is meant to validate runtime behavior.
          bun run build
          # Optional: stamp the shipped entrypoint here when the repo tests a release-shaped artifact.
          version-injector dist/script-name.sh --style sh --version "dev"
      - name: Put prepared entrypoint on PATH
        shell: bash
        run: echo "$PWD/dist" >> "$GITHUB_PATH"
      - name: Run Leia-backed example
        uses: tanaabased/actions/run-leia@v1
        with:
          scenarios: examples/${{ matrix.example }}/README.md
          shell: bash
          retry: 0
          stdin: true
```
