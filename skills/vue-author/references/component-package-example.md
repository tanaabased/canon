# Component Package Example

Use [Vite library mode](https://vite.dev/guide/build#library-mode) for a publishable Vue library. Keep the package build separate from the docs-site build. Externalize `vue` in the bundler configuration and declare the supported Vue range in `peerDependencies`; a bundled second Vue runtime is not a consumer test.

A package with one ESM entry and stylesheet can expose this small contract, adapted to its actual build output:

```json
{
  "type": "module",
  "files": ["dist/"],
  "exports": {
    ".": { "import": "./dist/components.js" },
    "./style.css": "./dist/style.css"
  }
}
```

Keep VitePress or other framework adapters under separate exports with optional framework peers. Do not import the adapter from the plain Vue entry. Add types or CommonJS exports only when the package supports and builds them.

## Consumer Example

Keep one minimal Vite fixture under `examples/vue/fixture/` with its own package manifest, entry, and component using public imports:

```js
import { ExampleComponent } from '@tanaab/example-components';
import '@tanaab/example-components/style.css';
```

Have the existing Leia examples gate build the package once and pass the absolute candidate tarball path as `COMPONENT_PACKAGE`. The scenario copies the fixture outside the checkout and builds it against that tarball:

```sh
fixture_dir="$(mktemp -d)"
trap 'rm -rf "$fixture_dir"' EXIT
cp -R examples/vue/fixture/. "$fixture_dir/"
cd "$fixture_dir"
npm install --ignore-scripts --no-audit --no-fund --package-lock=false "${COMPONENT_PACKAGE:?set the candidate tarball path}"
npm run build
```

The fixture owns its app and build dependencies; avoid checkout aliases, workspace links, or imports from `src/`. This build checks public exports, styles, and bundler integration. Add a browser assertion only when mounted behavior is the uncovered contract. Reuse this check in the owning examples gate rather than adding equivalent release steps.

See [Component Playground's consumer examples](https://github.com/tanaabased/component-playground/tree/main/examples) for Vue and VitePress implementations. Delegate tarball creation, trusted publishing, and release channels to [JavaScript Author](../../javascript-author/SKILL.md#deployment).
