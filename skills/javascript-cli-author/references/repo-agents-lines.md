# Repo `AGENTS.md` Lines

Use these lines only when the target repo wants Bun CLI product rules as durable ambient policy in its own `AGENTS.md`.

- Keep true user-facing Bun CLI entrypoints in `bin/` and declare them in `package.json` when package metadata is in scope.
- Commit shebang-bearing Bun CLI entrypoints executable.
- When a built CLI artifact is the shipped surface, keep the entrypoint friendly to `bun build` by preferring static imports and avoiding source-tree-only loading patterns.
- Validate Leia-backed Bun CLI scenarios against the built CLI artifact rather than `bun run` or a source entrypoint when the built artifact is what users actually consume.
- Keep CLI help, version, stream usage, and option precedence aligned with the shared CLI contract.
