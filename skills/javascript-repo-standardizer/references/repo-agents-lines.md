# Repo `AGENTS.md` Lines

Use these lines only when the target repo wants the JS/TS/Bun baseline as durable ambient policy in its own `AGENTS.md`.

- Keep JavaScript, TypeScript, and Bun code in the nearest owning scope, organized as public `bin/`, internal `scripts/`, orchestration `lib/`, unit-shaped `utils/`, and scope-local `test/` surfaces as needed.
- Keep each scope's `test/` directory flat by default, with specs, fixtures, fakes, and support code directly beneath it.
- Apply the same hoisting test to tests as to source; keep nested-scope tests with their owner instead of collecting them at repo root.
- Keep linting and formatting ownership separate: ESLint for lint rules and standalone Prettier for formatting.
- Prefer the shared baseline script shape such as `lint:eslint`, `format:check`, `format:write`, and composed `lint` when the repo adopts the standard baseline.
- Prefer Bun-first baseline package wiring for repos with meaningful JavaScript or TypeScript surfaces.
- When the repo owns TypeScript source, keep `typecheck` separate from lint and use the shared strict, no-emit TypeScript baseline.
- Treat baseline normalization as separate from ordinary runtime authorship and feature refactors.
