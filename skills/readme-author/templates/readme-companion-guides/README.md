<h1 align="center">{{ project_name }}</h1>

<!-- Strongly preferred when real assets and status signals exist. Use <picture> when separate dark and light images are available. -->

<p align="center">
  <img src="{{ project_image_path }}" alt="{{ project_name }}" width="180" />
</p>

<p align="center">
  {{ project_description }}
</p>

<p align="center">
  <a href="{{ release_url }}"><img src="{{ release_badge_url }}" alt="Latest stable release" /></a>
</p>

<p align="center">
  <a href="{{ interface_guide_url }}"><img src="{{ interface_badge_url }}" alt="{{ interface_name }}" /></a>
</p>

> Optional: add a short status, compatibility, safety, or support note when readers need it before starting.

## Overview

Summarize the project's most important capabilities and boundaries. Keep the common path here; move long-tail reference material into the companion guides.

For a complete inventory or deeper behavioral reference, see [Advanced](./ADVANCED.md).

## Quickstart

Show the fastest path to a successful first run. Delete this section when the repository has no truthful supported first-run path.

```sh
# install or clone
{{ install_command }}

# run the main command
{{ run_command }}
```

## Usage

Explain the workflows most readers need first.

```sh
# run the primary workflow
{{ primary_command }}
```

Document only common inputs and configuration here. Link the complete reference from the paragraph where readers first need it:

- `{{ common_option }}`: what it does and when most readers should use it
- `{{ common_env_var }}`: the common environment override

See [Advanced](./ADVANCED.md#configuration-reference) for the complete configuration contract.

When one substantial optional subject has its own audience, rename `topic-guide.md` to a stable subject name and link it here, such as a Codex, OpenClaw, operations, or upgrade guide.

## Verification

Keep this section only when readers need a separate check or help interpreting success; otherwise remove it. Show the shortest supported check without repeating verification already guaranteed by the primary command. Keep detailed fields, log interpretation, and recovery procedures in [Advanced](./ADVANCED.md#verification-details).

## Development

Keep this section contributor-focused and repo-specific.

```sh
# install dependencies
{{ install_command }}

# validate the project
{{ lint_command }}
{{ test_command }}
```

Call out build, generated-output, privileged, or machine-mutating workflows instead of presenting them as routine local commands.

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
