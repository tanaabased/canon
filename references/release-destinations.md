# Release Destinations

Use this reference to identify where Tanaab-owned release artifacts are delivered.

- Treat this as a routing map, not a replacement for the owning skill's `Deployment` or release workflow guidance.
- A GitHub Release may be the approval event and metadata surface for any row; the release destination is where consumers obtain the supported artifact.
- Decide destinations and npm privacy per package scope. A repository may intentionally use more than one destination.
- Treat repository publication as a peer destination. Follow [release composition](../skills/github-workflow-author/SKILL.md#release-composition) for shared immutable checkouts and consistent job names across destinations.

| Product surface                | Default release destination                      | Package and artifact contract                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex-compatible plugin bundle | npm                                              | Publish the complete plugin under `@tanaab` without `"private": true`; retain the native plugin name. Follow [Codex Plugin Author](../skills/codex-plugin-author/SKILL.md) for artifact checks and justified archive exceptions. |
| GitHub Action                  | Repository release tags and optional Marketplace | Commit the action runtime consumed through repository refs. Treat npm publication as a separate explicit package contract rather than an implied action destination.                                                             |
| Publishable JavaScript package | npm                                              | Use the `@tanaab` package identity and do not set `"private": true` on the publishable package scope.                                                                                                                            |
| Native OpenClaw code plugin    | npm, ClawHub, or both                            | When both are selected, keep the pipelines independently operable while aligning release source, version, manifest, runtime entries, contents, and compatibility.                                                                |

Use the owning repository's README to document its supported install path. Keep package preparation, validation, credentials, channels, and workflow mechanics in the applicable skill's deployment or release section.
