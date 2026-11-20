# Bun npm release workflow

Use this workflow when a published GitHub Release ships one Bun-managed package to npm. The npm job checks out the event commit, stamps the release version, packs once, and passes the same tarball to the dry run and publication. The repository job synchronizes changes that belong in Git.

- For a source-only package, validate the prepared files and omit the build. For generated packages, stamp before building and pack the directory containing the finished manifest and artifacts. Inspect the extracted tarball before handing its path to both publish steps.
- For a Codex plugin, stamp the npm and plugin manifests together and validate the extracted skills. For an OpenClaw plugin that also ships to ClawHub, give that destination its own validation and publication job. Keep npm credentials and permissions scoped to the npm job.
- Set `sync-edge-tag` to match the package's channel policy. In the repository job, rebuild only artifacts checked into Git. Rehearse preparation and the publication dry run in PRs; reserve live publication for the release event.

Destination: `.github/workflows/release.yml`.

```yaml
name: Release

on:
  release:
    types:
      - published

jobs:
  publish-npm:
    name: Publish npm
    runs-on: ubuntu-24.04
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout release source
        uses: actions/checkout@v7
        with:
          ref: ${{ github.sha }}
          fetch-depth: 0
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Validate source
        run: |
          bun run lint
          bun run test
      - name: Prepare release
        uses: tanaabased/actions/prepare-release@v1
      # Build here only when the package ships generated output, then format it.
      - name: Validate prepared package
        run: bun run format:check
      - name: Pack package
        id: pack
        uses: tanaabased/actions/npm-pack@v1
      # Run package-specific inspection and smoke checks against this exact tarball.
      - name: Dry-run publication
        uses: tanaabased/actions/publish-npm@v1
        with:
          tarball: ${{ steps.pack.outputs.tarball-path }}
          dry-run: true
      - name: Publish npm
        uses: tanaabased/actions/publish-npm@v1
        with:
          tarball: ${{ steps.pack.outputs.tarball-path }}
          sync-edge-tag: true

  publish-repo:
    name: Publish repo
    runs-on: ubuntu-24.04
    permissions:
      contents: read
    steps:
      - name: Checkout release source
        uses: actions/checkout@v7
        with:
          ref: ${{ github.sha }}
          fetch-depth: 0
      - name: Install Bun
        uses: tanaabased/actions/setup-bun@v1
      - name: Install dependencies
        run: bun install --frozen-lockfile --ignore-scripts
      - name: Publish repo
        uses: tanaabased/actions/publish-repo@v1
        with:
          commands: |
            # Add required manifest/artifact stamping here; build only committed output.
            bun run format:write
            bun run format:check
          sync-token: ${{ secrets.RELEASE_SYNC_TOKEN }}
```
