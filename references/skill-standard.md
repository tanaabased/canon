# Skill Standard

## Validation Contract

Use this file as the source of truth for canon skill validation.

- `[error]` means the skill should fail validation.
- `[warn]` means the skill is probably shaped poorly and should be reviewed.
- `[manual]` means a human should judge the rule because it is not fully machine-checkable.

## Identity and Naming

- `[error]` Creation and standardization use one variable identity input: `type`.
- `[error]` Frontmatter `metadata.owner` must exist and must equal `tanaab`.
- `[error]` Frontmatter `metadata.type` must be one of the ids listed in [`./skill-types.md`](./skill-types.md).
- `[error]` Frontmatter `metadata.type` must equal the selected type id.
- `[error]` The generated machine id must use lowercase letters, digits, and hyphens only.
- `[error]` The skill folder name must equal the generated machine id.
- `[error]` Frontmatter `name` must equal the skill folder name exactly.
- `[error]` Skill folder and frontmatter `name` must start with `tanaab-`.
- `[error]` Strip an accidental duplicate `tanaab-` prefix before writing the final machine id.

## Required Files

```text
skill-id/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── templates/     # optional, only when unique to this skill
├── assets/        # optional, only when unique to this skill
├── references/    # optional, only when unique to this skill
└── scripts/       # optional, only when unique to this skill
```

- `[error]` `SKILL.md` must exist.
- `[error]` `agents/openai.yaml` must exist.
- `[warn]` Create optional resource directories only when the skill actually needs them.
- `[warn]` Do not add auxiliary repo-style docs inside a skill such as `README.md`, `CHANGELOG.md`, or installation guides unless a runtime requires them.

## Required SKILL.md Shape

- `[error]` `SKILL.md` must start with YAML frontmatter.
- `[error]` Frontmatter must contain `name`, `description`, `license`, and `metadata`.
- `[error]` Frontmatter `license` must equal `MIT`.
- `[error]` Frontmatter `metadata` must contain `type`, `owner`, and `tags`.
- `[error]` Do not use top-level `type`, `owner`, or `tags`; Codex warns on unsupported top-level skill attributes.
- `[error]` Frontmatter `description` must start with `Tanaab-based`.
- `[error]` `metadata.tags` must be a list of strings.
- `[error]` `metadata.tags` must include the selected `owner` and `type`.
- `[error]` `metadata.tags` must include at least one category tag from [`./skill-tags.md`](./skill-tags.md).
- `[error]` Section order must match the selected type's order from [`./skill-types.md`](./skill-types.md).
- `[error]` Relative links in `SKILL.md` must resolve.
- `[manual]` `description` should say both what the skill does and when to use it.
- `[manual]` `When to Use` and `When Not to Use` should describe a narrow, concrete owned surface.
- `[warn]` Keep `metadata.tags` short. Prefer one category tag by default instead of a long keyword list.

## Required OpenAI Metadata

- `[error]` `agents/openai.yaml` must contain `interface.display_name`, `interface.short_description`, `interface.default_prompt`, and `interface.brand_color`.
- `[error]` `agents/openai.yaml` must contain `interface.icon_small` and `interface.icon_large`.
- `[error]` `interface.short_description` must start with `Tanaab-based`.
- `[error]` `interface.icon_small` and `interface.icon_large` must point to existing relative skill asset paths.
- `[error]` `interface.default_prompt` should explicitly mention the skill by `$<machine-id>`.
- `[error]` `interface.brand_color` must equal `#00c88a`.
- `[warn]` `display_name` should be unprefixed by default unless the user explicitly wants `Tanaab` in the human-facing title.
- `[manual]` After the `Tanaab-based` prefix, `short_description` should describe the skill outcome.

## Resource Placement Rules

- `[error]` Start every skill from [`../templates/skill-generic-skill.md`](../templates/skill-generic-skill.md).
- `[error]` For non-`generic` skills, inject the matching type section partial defined by [`./skill-types.md`](./skill-types.md), [`./skill-types.json`](./skill-types.json), and `scripts/skill-types-lib.js`.
- `[error]` Use the shared Tanaab owner contract from this standard and the validator. Do not load owner behavior from a separate owner-data folder.
- `[error]` Use kebab-case for repo-authored helper filenames in `scripts/`, `assets/`, `references/`, `prompts/`, and `templates/` unless a tool requires a fixed conventional filename.
- `[error]` `scripts/` is code-only. Do not store static registry data there as JS object literals.
- `[error]` Repo-level script filenames must end in `-cli.js`, `-task.js`, or `-lib.js`.
- `[error]` Machine-readable canon consumed by repo scripts must live in `references/*.json`.
- `[error]` Bundleable repo scripts must import shared templates, assets, and machine-readable canon explicitly so `bun build` can follow the dependency graph.
- `[warn]` Keep the default scaffold minimal.
- `[warn]` Move shared canon into repo-root `references/`, `guidance/`, `prompts/`, `templates/`, or `scripts/` instead of duplicating it inside one skill.
- `[warn]` Keep skill-bundled helpers in the skill's own `scripts/` directory. Do not treat them as repo-level package `bin/` entrypoints.
- `[warn]` `generic` is the fallback type. Prefer a narrower type when one clearly fits.
- `[warn]` Additional skill types should extend the shared base template and the shared type registry instead of inventing an unrelated structure without a strong reason.

## Scope and Size Rules

- `[warn]` A skill should own one concrete task surface.
- `[warn]` If a skill needs a routing matrix, broad arbitration rules, or heavy relationship language to stay understandable, split it.
- `[warn]` Do not add `## Relationship to Other Skills` by default. If a skill needs that section to make sense, challenge the scope first.
- `[warn]` Keep `SKILL.md` lean. Assume the agent is already capable and add only task-specific context that materially improves performance.
- `[warn]` Prefer references for detailed facts, schemas, and long examples instead of stuffing them into `SKILL.md`.
- `[warn]` Prefer scripts when deterministic reliability matters or the same code keeps being rewritten.
- `[warn]` Keep bundled references one hop from `SKILL.md`; link to them directly instead of hiding them behind deeper navigation.
- `[manual]` Bulk standardization should preserve the skill's core purpose and workflow unless the task explicitly asks for a behavioral rewrite.

## Prompting Rules

Ask only when the missing value changes identity or behavior:

- type
- new vs standardize mode
- skill purpose
- source skill path when standardizing
