# Skill Tags

Use `metadata.tags` in `SKILL.md` frontmatter as short discovery and filtering hints.

## Required Tags

Every canon skill should include:

- the selected `owner` id
- the selected `type` id
- at least one category tag from the list below

## Category Tags

Choose the smallest category that matches the skill's actual surface:

- `automation`
- `coding`
- `design`
- `docs`
- `frontend`
- `integration`
- `meta`
- `release`
- `research`
- `shell`
- `skills`
- `testing`
- `validation`
- `workflow`

## Rules

- Keep tags short and lowercase.
- Use hyphen-case when a tag needs multiple words.
- Do not use tags as a keyword dump.
- Prefer one category tag by default.
- A category tag may equal the selected type when that is the most honest classification.
- Add a second category tag only when the skill clearly spans two adjacent surfaces.
- Human-readable tag guidance lives here; the machine-readable companion is [`./skill-tags.json`](./skill-tags.json).
- Repo helpers should load tag data through `scripts/skill-tags-lib.js`, not through in-script tag registries.
