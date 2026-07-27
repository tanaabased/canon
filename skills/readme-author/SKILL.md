---
name: tanaab-readme-author
description: Tanaab-based authoring and standardization of repository README surfaces. Use when a user wants to structure or rewrite a repo README, choose between full, companion-guides, GitHub Action, or docs-wrapper mode, or keep README content aligned with the primary user entrypoint.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - documentation
  openclaw:
    emoji: '📖'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/readme-author
---

# README Author

## Overview

Tanaab-based authoring and standardization of repository README surfaces. Use when a user wants to structure or rewrite a repo README, choose between full, companion-guides, GitHub Action, or docs-wrapper mode, or keep README content aligned with the primary user entrypoint.

## When to Use

- Structure or rewrite a repository `README.md`.
- Choose between full, companion-guides, GitHub Action, or docs-wrapper mode.
- Decide when advanced or topical material belongs in `ADVANCED.md`, another root-level guide, or a fuller docs site.
- Keep a repo README aligned with the repo's primary user entrypoint and actual product surface.
- Tighten README sections, examples, and ordering without changing the underlying implementation surface.

## When Not to Use

- Do not use this skill for VitePress page implementation, theme work, or frontend styling once the docs-site surface is already chosen.
- Do not use this skill for release-note or changelog-only work.
- Do not use this skill for inline code comments, API extraction tooling, or docs deployment mechanics.

## Workflow

1. Confirm the request is README-led rather than frontend, release, or CI-led.
2. Load [`../../references/readme-standards.md`](../../references/readme-standards.md) and use it to choose the README mode intentionally.
3. Inventory the repository's existing README, root-level guides, docs site, real entrypoints, visual assets, and meaningful status signals before choosing a structure.
4. Keep the common path and roughly 80 percent of reader needs in the README. Treat 250 and 400 source lines as review signals, not validation limits.
5. When drafting from scratch or standardizing a weak README, use the local template that matches the chosen mode instead of inventing section shape ad hoc.
6. Strongly prefer a centered real visual, a concise row of truthful badges, and a one- or two-sentence description, but do not fabricate missing assets or status claims.
7. Validate that the final README matches one coherent mode and review VitePress when `README.md`, `ADVANCED.md`, and three or more topical guides are present.

## Optimization

- **Inspect:** Inventory the README, companion guides, docs site, visual assets, badges, current product behavior, and primary user entrypoints.
- **Compare:** Evaluate the chosen README mode, first-screen identity, truthful quickstart, common-path 80/20 split, length pressure, topical guides, and docs-site threshold.
- **Recommend:** Prioritize user navigation and factual clarity, report aligned documentation honestly, and never fabricate commands, status, or product behavior.
- **Apply:** After explicit authorization, make the smallest coherent documentation change and move long-tail material only when a companion guide or docs site is justified.
- **Verify:** Check links, commands, badges, assets, entrypoints, and the selected README mode against the current repository.

## Bundled Resources

- [../../references/readme-standards.md](../../references/readme-standards.md): README mode selection, companion-guide boundaries, section expectations, and docs-wrapper escalation rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): default VitePress escalation rule when a fuller docs surface is justified
- [./templates/README.md](./templates/README.md): local index for the README starter templates owned by this skill
- [./templates/readme-full/README.md](./templates/readme-full/README.md): starter for repositories that keep durable user-facing docs in one README
- [./templates/readme-companion-guides/README.md](./templates/readme-companion-guides/README.md): primary entrypoint starter for repositories with root-level companion guides
- [./templates/readme-companion-guides/ADVANCED.md](./templates/readme-companion-guides/ADVANCED.md): starter for mixed advanced and long-tail reference material
- [./templates/readme-companion-guides/topic-guide.md](./templates/readme-companion-guides/topic-guide.md): renameable starter for one substantial topical guide
- [./templates/readme-github-action/README.md](./templates/readme-github-action/README.md): starter for GitHub Action repositories whose README must carry the action contract
- [./templates/readme-docs-wrapper/README.md](./templates/readme-docs-wrapper/README.md): starter for repositories that keep a strong README entrypoint but move durable docs into VitePress

## Validation

- Confirm the final README clearly fits one mode: full README, companion guides, GitHub Action README, or docs wrapper.
- Confirm any quickstart is truthful and the primary usage path appears before deeper reference material.
- Confirm companion guides declare their purpose, link back to the README, and avoid duplicating the common path.
- Confirm the visual identity and badges use real assets and truthful signals, or are omitted without blocking the README.
- Confirm the docs-site threshold was reviewed when `README.md`, `ADVANCED.md`, and three or more topical guides are present.
- Confirm the README stays a repository entrypoint rather than a generic link farm or unstructured manual.
