---
name: tanaab-plugin-info
description: Tanaab-based identification of the installed Canon version, plugin author, and shipped skills from the loaded artifact.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags: [tanaab, generic, plugins]
  openclaw:
    emoji: '📦'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/plugin-info
    requires:
      bins: [bun]
---

# Canon Plugin Info

## Overview

Report the identity and skill inventory shipped with the Canon artifact that supplied this skill.

## When to Use

- Answer questions such as “Which Canon version is this chat using?”, “Who made Canon?”, or “Which skills ship with this plugin?”

## When Not to Use

- Use release information for questions about the latest published Canon version or release history.

## Workflow

1. Run `bun --no-install <skill-directory>/scripts/plugin-info.js` and use its JSON as the source. Follow the packaged execution instructions when the reader supplies the command instead of a filesystem path.
2. Show the declared package version. When the command also returns `developmentVersion`, display it as **Development version**. For inventory questions, report the requested names and descriptions. Cite the command that supplied the data.
3. For a human-readable response, use a Markdown blockquote headed `## 📦 CANON PLUGIN INFO` with sentence-case field labels and quoted blank lines. For a version lookup, include the package, version, author, skill count, and source. Expand the inventory when asked. Use `## ⚠️ CANON PLUGIN INFO UNAVAILABLE` when the artifact's metadata cannot be obtained.
4. When asked for JSON, return the command result directly as JSON.

<!-- packaged-execution -->

## Bundled Resources

- The [plugin info command](./scripts/plugin-info.js) returns the package identity, plugin metadata, and shipped skill inventory.

## Validation

- Verify that each reported field comes from the artifact that supplied the skill.
