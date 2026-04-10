# Repo `AGENTS.md` Lines

Use these lines only when the target repo wants the JS/Bun baseline as durable ambient policy in its own `AGENTS.md`.

- Keep JavaScript and Bun repos aligned to the shared baseline for scope folders, `bin/`, `utils/`, and related layout decisions.
- Keep linting and formatting ownership separate: ESLint for lint rules and standalone Prettier for formatting.
- Prefer the shared baseline script shape such as `lint:eslint`, `format:check`, `format:write`, and composed `lint` when the repo adopts the standard baseline.
- Prefer Bun-first baseline package wiring for repos with meaningful JavaScript or TypeScript surfaces.
- Treat baseline normalization as separate from ordinary runtime authorship and feature refactors.
