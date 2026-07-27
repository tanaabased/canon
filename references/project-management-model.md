# GitHub-Backed Project Management Model

Use this reference for Tanaab project-management terminology and lifecycle ownership. GitHub is the current implementation, while Canon names the domain concepts that should remain meaningful if the provider changes later.

## Canonical Mapping

| Canon concept         | GitHub representation              | Contract                                                                       |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| Project               | Repository (`OWNER/REPO`)          | Canonical project container and source of project identity                     |
| Task                  | Issue                              | Atomic, independently trackable unit of work and authority for task state      |
| Project milestone     | Milestone                          | Bounded project outcome or timebox that groups Tasks                           |
| Change                | Pull request                       | Delivery and review vehicle that may provide evidence for one or more Tasks    |
| Validation            | Check run or GitHub Actions result | Automated evidence about a Change or repository state                          |
| Release               | Git tag plus GitHub Release        | Packaged project delivery and its published metadata                           |
| GitHub Projects board | Optional planning view             | Visualization of project work, never the Project's identity or source of truth |

Use **Project** and **Task** in provider-neutral Canon guidance. Use **repository**, **issue**, **pull request**, and other GitHub terms when describing exact provider inputs, API fields, or failure modes. Always qualify **GitHub Projects board** so it is not confused with the repository-backed Project.

## Lifecycle Ownership

- The Task owns task state and completion. A pull request is not the Task, and passing Validation does not by itself prove completion.
- A Change may implement, review, or provide evidence for a Task. Non-code Tasks may have no pull request.
- A Task is ready for completion only when its acceptance evidence is sufficient and no relevant Change or Validation remains pending or blocking.
- A pull request linked through GitHub's supported mechanism may close its Task when it merges into the default branch. Treat that as an implementation of task-state transition, not as a transfer of task ownership to the pull request.
- A Release groups delivered project state; it does not replace the Tasks, Changes, or Validation that justify that state.
- Cross-project strategic goals are intentionally unmapped until Tanaab adopts a separate durable goal contract.

## Skill Naming and Types

- Treat project management as a domain and category, not a skill type.
- Lead skill names with the domain concept when the skill owns a Project, Task, Project Milestone, or Release workflow.
- Lead with GitHub when GitHub-specific mechanics are the owned product surface, such as Actions or workflow topology.
- Use an `integration` skill for one provider-backed object or mutation boundary whose inputs, authorization, and remote failures dominate the workflow.
- Use a `workflow` skill for a fixed lifecycle that coordinates evidence or handoffs across multiple objects without becoming a dynamic router.
- Keep separate skills when tools, permissions, mutation boundaries, or failure modes differ materially, even when they participate in the same project lifecycle.

## Boundaries

- A GitHub Projects board is optional. Do not require or create one merely because a Project exists.
- Do not infer that a passing check makes a Task complete, that a merged pull request satisfies undocumented acceptance criteria, or that an open pull request means every Task it references is incomplete.
- Do not merge project-container mutation, task-state assessment, release authoring, and whole-project optimization into one umbrella skill.
