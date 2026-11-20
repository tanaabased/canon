# Canon Skill Contributions

Follow the [Skill Standard](../references/skill-standard.md) when creating or editing a skill.

- Link directly to files using skill-relative paths. When a skill directly references a shared file or directory, track a relative symlink at the path the skill uses. Use catalog names when handing off to another skill.
- Put reader-facing Markdown and annotated starters in `references/`, exact inputs for commands and builds in `templates/`, and catalog icons in `assets/`. Keep runnable Leia scenarios in the repo’s `examples/` directory.
- In `build.config.js`, declare `copy: ['references/**', 'templates/**']` for every skill. Add skill-relative `entrypoints` globs for commands under `scripts/`. For packaged command instructions, put `<!-- packaged-execution -->` in `SKILL.md`.
- Keep every resource the skill needs inside its directory in the extracted package. Check links inside bundled references and include assets required by commands.

Track new inputs with Git before pushing and check the [PR release rehearsal](../DEVELOPMENT.md#validation) for packaging errors.
