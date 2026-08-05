# Release Destinations

Use this reference to identify where Tanaab-owned release artifacts are delivered.

- Treat this as a routing map, not a replacement for the owning skill's `Deployment` or release workflow guidance.
- A GitHub Release may be the approval event and metadata surface for any row; the release destination is where consumers obtain the supported artifact.
- Decide destinations and npm privacy per package scope. A repository may intentionally use more than one destination.

| Product surface                | Default release destination                      | Package and artifact contract                                                                                                                                        |
| ------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex-compatible plugin bundle | Versioned archive attached to a GitHub Release   | Set the package root to `"private": true`; `package.json` may still own tooling and runtime dependencies included in the archive.                                    |
| GitHub Action                  | Repository release tags and optional Marketplace | Commit the action runtime consumed through repository refs. Treat npm publication as a separate explicit package contract rather than an implied action destination. |
| Publishable JavaScript package | npm                                              | Use the `@tanaab` package identity and do not set `"private": true` on the publishable package scope.                                                                |
| Native OpenClaw code plugin    | npm, ClawHub, or both                            | When both are selected, keep the pipelines independently operable while aligning release source, version, manifest, runtime entries, contents, and compatibility.    |

Use the owning repository's README to document its supported install path. Keep package preparation, validation, credentials, channels, and workflow mechanics in the applicable skill's deployment or release section.
