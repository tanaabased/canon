# {{ project_name }}

<!-- Strongly preferred when real assets and status signals exist. Use <picture> when separate dark and light images are available. -->

<p align="center">
  <img src="{{ project_image_path }}" alt="{{ project_name }}" width="180" />
</p>

<p align="center">
  <a href="{{ release_url }}"><img src="{{ release_badge_url }}" alt="Latest release" /></a>
  <img src="{{ platform_or_runtime_badge_url }}" alt="{{ supported_platform_or_runtime }}" />
</p>

One or two sentences that explain what the project is, who it is for, and why it exists.

> Optional: add a short status, compatibility, or support note when readers need it before starting.

## Overview

Summarize the project's most important capabilities. Prefer a short paragraph or a concise list over repeating the sections below.

## Quickstart

Show the fastest path to a successful first run. Delete this section when the repository has no truthful supported first-run path.

```sh
# install or clone
{{ install_command }}

# run the main command
{{ run_command }}
```

## Installation

Explain the supported installation or setup path.

- Required runtime or tool versions
- Required environment or credentials
- Any platform-specific notes that matter before use

## Usage

Explain the most important user flows first.

```sh
# run the primary workflow
{{ primary_command }}
```

Add one or two follow-up examples only if they materially expand understanding.

## Configuration

Document the main configuration surface only when the repo actually exposes one.

- `{{ env_var_one }}`: what it does and when to set it
- `{{ env_var_two }}`: what it does and when to set it

If configuration grows beyond a concise section, review whether the full reference belongs in a companion guide or a VitePress docs site.

## Advanced

Use this section only when the repo has meaningful secondary flows that still fit comfortably inside one README. Switch to the companion-guides template when advanced material becomes a durable reference.

## Development

Keep this section contributor-focused and repo-specific.

```sh
# install dependencies
{{ install_command }}

# validate the project
{{ lint_command }}
{{ test_command }}

# build the distributable artifact when the repository owns one
{{ build_command }}
```

## Issues, Questions and Support

Point users to the right support channels, issue queue, or community space.

## Changelog

Link to `CHANGELOG.md` and releases when the repo maintains them.

## Maintainers

- `@{{ maintainer }}`

## Contributors

<a href="https://github.com/{{ repo_slug }}/graphs/contributors">
  <img src="https://contrib.rocks/image?repo={{ repo_slug }}" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
