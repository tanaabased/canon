# Optimization Operations

Use these operations as evidence-led lenses when optimizing a persistent surface. They are not mandatory output fields, and an aligned surface may need only **keep**. Do not manufacture a change so every operation appears.

- **Keep:** Preserve intentional, aligned state and name why it should remain.
- **Reconcile:** Resolve contradictions between implementation, configuration, documentation, generated artifacts, tests, or other representations by identifying the authoritative owner; this is not a checklist of files to change.
- **Deduplicate:** Remove repeated logic or content while preserving genuinely distinct consumers and contexts.
- **Consolidate/Merge:** Combine compatible material that has the same owner, contract, and change lifecycle.
- **Split:** Separate an overloaded artifact when its parts have distinct owners, contracts, audiences, permissions, or change lifecycles.
- **Extract:** Move independently useful, reusable, or testable material into a focused owned unit while keeping its entry surface thin.
- **Move:** Relocate misplaced material to its nearest justified owner and update every affected import, link, caller, or reference.
- **Tighten:** Reduce ambiguity, excess scope, accidental API, permissions, prose, or validation while preserving required behavior.
- **Remove:** Delete obsolete, unreachable, contradicted, or redundant material only after confirming that no live consumer still depends on it.

When ownership or terminology changes, follow the affected contract through implementation, callers, tests, fixtures, executable examples, generated surfaces, and documentation. Move responsibility as well as files: callers should use the new owning boundary instead of retaining their own copy of the old behavior. Update affected names and data shapes, then remove superseded paths, aliases, and representations once their consumers have migrated, except where a supported external contract still requires them. Check for stale references and validate the resulting flow through the public surface; update only surfaces affected by the change.

Reconcile contradictions before polishing their wording. Apply the [documentation change gate](./documentation-standards.md#documentation-change-gate) before recommending prose additions or extraction; remove unnecessary content before giving it another home. Prefer deduplication, consolidation, extraction, movement, tightening, or removal over adding another parallel representation. Preserve behavior and external state unless the user authorizes a change, and verify the resulting single source of truth through the owning skill's full contract.
