# Prettier ignore baseline

Merge these entries into the existing ignore file. Keep the dependency, build, cache, documentation-output and lockfile exclusions, and preserve project-specific exclusions. Add paths for generated output in the target repository.

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
