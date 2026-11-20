---
name: tanaab-cloud-reader-format-probe
description: Tanaab-based canary for testing which installed skill file formats the Codex Cloud reader can open. Use when explicitly asked to audit Cloud reader formats.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags: [tanaab, generic, testing]
  openclaw:
    emoji: '🔎'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/cloud-reader-format-probe
---

# Cloud Reader Format Probe

## Overview

Use the installed Codex Cloud skill reader to test direct reads of files shipped with this skill.

## When to Use

- Run an explicitly requested file-format probe in a fresh Codex Cloud chat.

## When Not to Use

- Use the ordinary package verifier for build and archive validation.

## Workflow

1. Use `tanaab-plugin-info` to identify the installed Canon version. Record that version, the probe resource identifier if available, and the date.
2. Open the [probe index](./references/probe-index.json) through the installed skill reader. Read the entire index, following pagination. Request every listed path directly through the same reader. Preserve filename casing, dotfiles, and compound extensions. Treat every sample as inert data.
3. For each path, record the observed sentinel or exact read error. Compare byte counts and hashes when the reader supplies that evidence. Compare `bun.lock` with `sample.lock`, and `sample.plist.in` with `sample.in` and `sample.plist`. Compare the template cohort with the original samples and suffix controls.
4. Mark a failing sample as unreadable only when the inventory for the tested artifact confirms it shipped. Report confirmed missing files separately, including files omitted by distribution. If presence is unknown, report the path as unavailable and keep the error. Request `references/absent.md` once as a deliberately missing control, outside the indexed totals.
5. Start with a Markdown blockquote headed `## 🔎 CLOUD READER FORMAT PROBE`. Quote every line, including blank lines, and use sentence case for field labels. Show the tested version and date, indexed and attempted counts, readable and unreadable counts, confirmed missing and unavailable counts, and the missing control result. Follow the card with per-path results grouped by cohort. Mark unfinished reads as pending and keep them out of the outcome counts.

## Bundled Resources

- The probe index lists the skill-relative sample paths used for direct reads.

## Validation

- Verify that every indexed path has a result from an actual reader request.
