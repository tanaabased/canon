# Repo `AGENTS.md` Lines

Use these lines only when the target repo wants shell CLI rules as durable ambient policy in its own `AGENTS.md`.

- Keep maintained Bash or PowerShell CLI entrypoints aligned with the shared CLI contract for help output, version reporting, stream usage, and option precedence.
- Commit shebang-bearing shell entrypoints executable and keep non-shebang files non-executable.
- Use Leia-backed scenarios when the main risk is observable shell CLI contract behavior rather than helper internals.
- Do not run machine-mutating Leia scenarios locally by default; keep those suites CI-first unless the user explicitly asks for local execution or the suite is clearly non-mutating.
- Run narrow local validators such as `shellcheck`, PowerShell parse checks, or `PSScriptAnalyzer` when those surfaces are available.
