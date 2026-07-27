# GitHub-Backed Project Management Model

Use this reference for Tanaab project-management terminology and lifecycle ownership. GitHub is the current implementation, while Canon names the domain concepts that should remain meaningful if the provider changes later.

## Canonical Mapping

| Canon concept         | GitHub representation              | Contract                                                                       |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| project               | repository (`OWNER/REPO`)          | Canonical project container and source of project identity                     |
| task                  | issue                              | Atomic, independently trackable unit of work and authority for task state      |
| project milestone     | milestone                          | Bounded project outcome or timebox that groups tasks                           |
| change                | pull request                       | Delivery and review vehicle that may provide evidence for one or more tasks    |
| validation            | check run or GitHub Actions result | Automated evidence about a change or repository state                          |
| release               | Git tag plus GitHub Release        | Packaged project delivery and its published metadata                           |
| GitHub Projects board | optional planning view             | Visualization of project work, never the project's identity or source of truth |

Treat **project**, **task**, **project milestone**, **change**, **validation**, and **release** as ordinary lowercase domain nouns, not formal type names. Capitalize them only when grammar requires it or when they appear in a proper skill, product, or document name such as **Project Author** or **GitHub Release**.

Use the domain nouns in provider-neutral Canon guidance. Use **repository**, **issue**, **pull request**, **check**, and other GitHub terms when describing exact provider objects, inputs, API fields, commands, technical configuration, or failure modes. Bridge the layers on first mention when useful, such as "the project's GitHub repository." Always qualify **GitHub Projects board** so it is not confused with the repository-backed project.

## Lifecycle Ownership

- The task owns task state and completion. A pull request is not the task, and passing validation does not by itself prove completion.
- A change may implement, review, or provide evidence for a task. Non-code tasks may have no pull request.
- A task is ready for completion only when its acceptance evidence is sufficient and no relevant change or validation remains pending or blocking.
- A pull request linked through GitHub's supported mechanism may close its task when it merges into the default branch. Treat that as an implementation of task-state transition, not as a transfer of task ownership to the pull request.
- A release groups delivered project state; it does not replace the tasks, changes, or validation that justify that state.
- Cross-project strategic goals are intentionally unmapped until Tanaab adopts a separate durable goal contract.

## Skill Naming and Types

- Treat project management as a domain and category, not a skill type.
- Lead skill names with the domain concept when the skill owns a project, task, project milestone, or release workflow.
- Lead with GitHub when GitHub-specific mechanics are the owned product surface, such as Actions or workflow topology.
- Retain repository or repo in a technical skill name when the repository container, layout, configuration, or tooling baseline is the exact owned surface. Do not rename such a surface to project authoring merely to remove provider vocabulary.
- Use an `integration` skill for one provider-backed object or mutation boundary whose inputs, authorization, and remote failures dominate the workflow.
- Use a `workflow` skill for a fixed lifecycle that coordinates evidence or handoffs across multiple objects without becoming a dynamic router.
- Keep separate skills when tools, permissions, mutation boundaries, or failure modes differ materially, even when they participate in the same project lifecycle.

## Boundaries

- A GitHub Projects board is optional. Do not require or create one merely because a project exists.
- Do not infer that a passing check makes a task complete, that a merged pull request satisfies undocumented acceptance criteria, or that an open pull request means every task it references is incomplete.
- Do not merge project-container mutation, task-state assessment, release authoring, and whole-project optimization into one umbrella skill.
