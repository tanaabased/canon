# Template Placeholders

When writing a Canon template or annotated example, give each fill-in a descriptive lowercase snake_case name with one space inside the braces, as in `{{ docs_url }}`. Use a whole token for a link destination, such as `[Documentation]({{ docs_url }})`. Keep known destinations such as `./ADVANCED.md` as ordinary links.

When you copy a template or adapt an example into a project, replace each Canon fill-in in the destination with the project's actual value. For example, use the project's documentation URL for `{{ docs_url }}`. If the project has no docs site, omit the optional link. If a required value is unknown, ask for it before delivering the file. Keep the tokens in the reusable starter.

When a tool supplies the value, use the syntax that tool expects. In one README, the author can fill in the title while GitHub evaluates an expression in the workflow copied from a fenced example.

| File or context                                           | Who supplies the value       | Example                                                                                              |
| --------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| README or PR starter (`.md`)                              | The author adapting the file | `# {{ project_name }}` or `Closes #{{ issue_number }}`                                               |
| Skill Author scaffold (`.md`, including YAML frontmatter) | Canon's scaffolder           | `name: {{ skill_id }}`. The renderer also accepts compact tokens and spaces or tabs around the name. |
| JavaScript template literal (`.js`, `.ts`)                | The JavaScript runtime       | `` `Hello, ${name}!` ``                                                                              |
| Vue template (`.vue`)                                     | Vue                          | `{{ resolvedTitle }}` refers to a component binding.                                                 |
| GitHub Actions workflow (`.yml`)                          | GitHub Actions               | `runs-on: ${{ matrix.os }}`                                                                          |
| Shell command (`.sh` or a runnable shell block)           | The shell                    | `"${TMPDIR}/output"`                                                                                 |
| Release heading (`CHANGELOG.md`)                          | The release action           | Preserve `{{ UNRELEASED_VERSION }}` exactly as written in the release heading.                       |
