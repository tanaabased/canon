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

Summarize the project's most important capabilities without reproducing the docs-site navigation.

## Quickstart

Show the shortest path to a successful first run. Delete this section when the repository has no truthful supported first-run path.

```sh
# install or clone
{{ install_command }}

# run the main command
{{ run_command }}
```

Keep this section short. The README should prove the first step works, not reproduce the full docs site.

## Documentation

The full documentation for `{{ project_name }}` lives at [Documentation]({{ docs_url }}).

Start here:

- [Getting Started]({{ docs_getting_started_url }})
- [Install or Setup]({{ docs_install_url }})
- [Usage or Core Workflow]({{ docs_usage_url }})
- [Configuration or Reference]({{ docs_reference_url }})

Add only the key routes readers actually need. Do not mirror the entire VitePress sidebar here.

## Development

Keep this section for repo contributors and maintainers.

```sh
# install dependencies
{{ install_command }}

# validate the project
{{ lint_command }}
{{ test_command }}

# build the distributable artifact when the repository owns one
{{ build_command }}
```

If contributor docs become extensive, move them into the VitePress docs site and keep only the short local-dev entrypoint here.

## Issues, Questions and Support

Point users to the correct issue queue, community space, or support channel.

## Changelog

Link to `CHANGELOG.md` and releases when the repo maintains them.

## Maintainers

- `@{{ maintainer }}`

## Contributors

<a href="https://github.com/{{ repo_slug }}/graphs/contributors">
  <img src="https://contrib.rocks/image?repo={{ repo_slug }}" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Other Selected Resources

- [License]({{ license_url }})
