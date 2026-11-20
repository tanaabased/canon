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
---

# Canon Plugin Info

## Overview

Report the identity and skill inventory shipped with the Canon artifact that supplied this skill.

## When to Use

- Answer questions such as “Which Canon version is this chat using?”, “Who made Canon?”, or “Which skills ship with this plugin?”

## When Not to Use

- Use release information for questions about the latest published Canon version or release history.

## Workflow

1. Open the [plugin information](./references/plugin-info.json) through the installed skill reader. Use that file as the sole source.
2. For identity questions, report the requested package name and version or plugin name, ID, author, and repository. For inventory questions, report the requested names and descriptions from the shipped skill list.
3. Cite the resource path or identifier returned by the reader. If the file is unreadable or missing, report the installed version and inventory as unavailable.
4. Put the result in a Markdown blockquote headed `## 📦 CANON PLUGIN INFO`. Quote every line, including blank lines, and use sentence case for field labels. For a version lookup, show the package, version, author, shipped skill count, and source. Expand the inventory when asked. Use `## ⚠️ CANON PLUGIN INFO UNAVAILABLE` when the resource cannot be read.
5. Use the bundled JSON directly when another workflow needs the metadata. When asked for JSON output, return the contents of the same resource in a fenced `json` block.

## Bundled Resources

- The plugin information file contains the package identity, plugin metadata, and shipped skill inventory.

## Validation

- Verify that each reported field comes from the resource read in this chat.
