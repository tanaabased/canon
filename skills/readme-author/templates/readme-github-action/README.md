# {{ action_name }}

<!-- Strongly preferred when real assets and status signals exist. Use <picture> when separate dark and light images are available. -->

<p align="center">
  <img src="{{ action_image_path }}" alt="{{ action_name }}" width="180" />
</p>

<p align="center">
  <a href="{{ release_url }}"><img src="{{ release_badge_url }}" alt="Latest release" /></a>
  <a href="{{ workflow_url }}"><img src="{{ workflow_badge_url }}" alt="Build status" /></a>
</p>

One or two sentences that explain what the action does, who it is for, and the workflow problem it solves.

> Optional: add a short status, compatibility, or support note when readers need it before copying the action into a workflow.

## Inputs

Document every supported action input in one table.

| Name               | Description                           | Default               | Example               |
| ------------------ | ------------------------------------- | --------------------- | --------------------- |
| `{{ input_name }}` | What it controls and when it matters. | `{{ input_default }}` | `{{ input_example }}` |

## Outputs

Use this section only when the action actually sets outputs.

| Name                | Description                     | Example                |
| ------------------- | ------------------------------- | ---------------------- |
| `{{ output_name }}` | What it returns to later steps. | `{{ output_example }}` |

Delete this section if the action has no outputs.

## Caveats

Use this section for action-specific contract details users need before relying on the action.

- Required permissions
- Trigger-specific behavior
- Checkout or repository assumptions
- Runner, shell, or filesystem caveats

## Usage

### Basic Usage

```yaml
- name: Run {{ action_name }}
  uses: '{{ repo_slug }}@v1'
```

### Advanced Usage

```yaml
- name: Run {{ action_name }}
  uses: '{{ repo_slug }}@v1'
  with:
    '{{ input_name }}': '{{ input_example }}'
```

If the action also has a VitePress docs site, add a short `Documentation` section after `Usage` that links deeper guides. Keep the input, output, caveat, and usage contract in this README even when deeper docs exist elsewhere.

## Development

Keep this section contributor-focused and repo-specific.

```sh
# install dependencies
{{ install_command }}

# validate the action
{{ lint_command }}
{{ test_command }}

# build the committed runtime artifact when the action owns one
{{ build_command }}
```

## Changelog

Link to `CHANGELOG.md` and releases when the action maintains them.

## Releasing

Describe the release trigger only when maintainers need a short repo-local reminder.

## Maintainers

- `@{{ maintainer }}`

## Contributors

<a href="https://github.com/{{ repo_slug }}/graphs/contributors">
  <img src="https://contrib.rocks/image?repo={{ repo_slug }}" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
