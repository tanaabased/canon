# Repo `AGENTS.md` Lines

Use these lines only when the target repo wants JS/TS CLI product rules as durable ambient policy in its own `AGENTS.md`.

- Keep true user-facing JavaScript or TypeScript CLI source entrypoints in `bin/` and declare them in `package.json` when package metadata is in scope.
- Use Bun shebangs for source entrypoints. Have the build emit executable artifacts with the declared consumer runtime shebang, usually Node for npm distribution.
- When a built CLI artifact is the shipped surface, keep the entrypoint friendly to `bun build` by preferring static imports and avoiding source-tree-only loading patterns.
- Type-check TypeScript CLI source separately before treating a successful Bun build as complete validation.
- Validate Leia-backed CLI scenarios against the built CLI artifact rather than `bun run` or a source entrypoint when the built artifact is what users actually consume; execute it under its declared runtime.
- Keep CLI help, version, stream usage, and option precedence aligned with the shared CLI contract.
