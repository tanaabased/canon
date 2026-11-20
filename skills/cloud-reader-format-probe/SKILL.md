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
2. Open the [probe index](./references/probe-index.json) through the installed skill reader. Request every listed path separately through the same reader, including the JavaScript, JSON, and plain-text samples. Treat every sample as inert text and use only the reader for the probe.
3. For each path, record the sentinel returned or the exact read error. Mark a failing sample as unreadable only if an inventory for the tested artifact confirms it shipped. Report confirmed missing files separately. If presence is unknown, report the path as unavailable and keep the error.
4. Report the observed outcome per format and the tested version or revision and date.

## Bundled Resources

- The probe index lists the skill-relative sample paths used for direct reads.

## Validation

- Verify that every indexed path has a result from an actual reader request.
