# Prettier ignore baseline

For a new repository, start its root `.prettierignore` with the entries below. For an existing repository, merge missing patterns and retain project-specific exclusions and intentional re-inclusions in their effective order.

The baseline covers dependencies, generated builds, coverage, caches, VitePress output and the Bun lockfile. If the project generates files elsewhere, add that output path precisely. Keep hand-authored documentation and source in the formatting check. Run the repository's format check after merging the patterns.

Destination: `.prettierignore`.

```text
node_modules
dist
coverage
temp
cache
_site
.vitepress/cache
.vitepress/dist
bun.lock
```
