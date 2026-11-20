# JavaScript action smoke workflow

Use this workflow to exercise the action a pull request would ship. Invoke `uses: ./` from the candidate checkout. For a JavaScript action, prepare the entrypoint named in `action.yml`; a composite action can run directly when its referenced steps already exist in the checkout.

Replace `example-input` and the sample file and tag assertions with observable behavior from the action's contract. For an output-producing action, give the action step an ID and assert the declared output. For a file-producing action, inspect the resulting file. Keep the tag assertion only for an action that creates tags, and run assertions after failure only when that state is meaningful.

Destination: `.github/workflows/pr-smoke-tests.yml`.

```yaml
name: Action Smoke Tests

on:
  pull_request:

jobs:
  smoke-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os:
          - ubuntu-24.04

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Install bun
        uses: tanaabased/actions/setup-bun@v1

      - name: Install deps and prep
        run: |
          bun install --frozen-lockfile --ignore-scripts
          bun run build

      - name: Run action
        uses: ./
        with:
          example-input: example-value

      - name: 'TEST: should update the expected file'
        if: always()
        run: |
          if grep "expected value" "${{ github.workspace }}/path/to/file"; then
            echo "::notice title=TEST PASSED::Expected file was updated"
          else
            echo "::error title=TEST FAILED::Expected file was not updated"
            exit 1
          fi
        shell: bash

      - name: 'TEST: should create the expected tag'
        if: always()
        run: |
          if git --no-pager tag --points-at HEAD | grep "v1.2.3"; then
            echo "::notice title=TEST PASSED::Expected tag was created"
          else
            echo "::error title=TEST FAILED::Expected tag was not created"
            exit 1
          fi
        shell: bash
```
