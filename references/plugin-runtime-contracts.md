# Plugin Runtime Contracts

Apply this contract when designing, changing, or reviewing plugin runtime integration, workflow state, or model-facing tools and commands in Codex or OpenClaw. Packaging-only work does not require a runtime redesign.

## Native Ownership and Workflow State

- Prefer supported host-native mechanisms and existing owners for conversation, scheduling, identity, authorization, lifecycle, and effects. Verify that a host surface supports the plugin's installation and trust class and the required behavior; an exported type alone is not proof. Keep necessary product-specific behavior with its existing owner when no compatible supported primitive exists, and document that boundary without reaching into private host internals.
- Let native conversation own investigation, planning, clarification, implementation, and continuation. Do not mirror it in a parallel controller or conversation state machine. Missing progress records, assessments, summaries, cards, or coordinator acknowledgments must not block otherwise authorized work.
- Before adding persistent workflow state, a receipt, checkpoint, retry, or blocking gate, name the concrete wrong external effect or resource loss it prevents and why existing native or provider evidence cannot prevent it. Put that reasoning in the existing change review, not a new tracking artifact. Convenience, observability, or agreement between internal records does not justify a prerequisite for work.
- Retain state needed to protect owned effects and resources, including authorization, exact routing, duplicate prevention, uncertain publication, and safe cleanup. Keep optional progress and presentation records optional. An uncertain effect must be reconciled through its original owner before retrying; missing bookkeeping is not proof that work is unmanaged or that no effect occurred.
- Repair failures in the existing owner, first considering removal of an unnecessary dependency. A verified child invocation must not wait for later coordinator bookkeeping to obtain its context. Reuse native creation evidence instead of adding readiness handshakes, polling loops, or recovery journals to compensate.

## Model-Facing Arguments and Execution Binding

- Let the model supply authored content and genuine task or resource choices. Execution code supplies facts already determined by the verified native invocation. Use empty input only when no additional semantic choice remains; do not erase a real selection merely to simplify a schema.
- Exclude native caller identity, agent and workspace binding, the current task or workflow owner, and invocation-bound source or authority from model-input schemas. Resolve them through existing runtime owners, separately from authored arguments. Reject attempted overrides before effects, even when supplied values match the binding. Prompt-injected context and model-echoed identifiers or receipts are not execution authority.
- Resolve known checkout, destination, configuration, and receipt metadata internally when the operation and verified invocation determine them. Keep explicit selectors for real choices, such as another issue, a selected comment URL, a repository, or a resource to retire. Selecting a resource neither changes the caller's identity nor grants authority over it. Keep operator-only binding changes at their authorized operator boundary.
- Keep fingerprints, source revisions, version and concurrency checks, and effect receipts inside their owning implementation when they prevent stale or duplicate effects. Do not require routine model transcription of known IDs or hashes. Preserve the exact selected source, draft, and destination across preparation, execution, and recovery; never substitute the latest record.
- If native evidence cannot distinguish candidates, expose the meaningful choice or report the specific limitation. Do not guess, silently fall back to unmanaged execution, or create a parallel context registry or persistence gate merely to hide arguments. Reuse existing runtime evidence and effect owners.
- Update schemas, callers, and recovery instructions together. Tolerant optional binding fields or prompt reminders do not enforce this contract. Ordinary argument correction is distinct from an authorization denial; preserve actual native denials and resource protections.

## Verification

Use the existing test owners and runtime adapters to verify the affected contract:

- Exercise plugin-owned mapping, policy, failure isolation, and recovery with deterministic boundary fixtures; preserve negative cases when consolidating. Native-host tests earn their cost by proving supported integration, event delivery, trust, or lifecycle behavior those fixtures cannot establish, not by retesting host guarantees or merely observing successful bookkeeping. Packaging criteria remain with the plugin author; a correct payload alone does not prove runtime integration.
- Ordinary calls work with authored content and meaningful selectors, without internal binding identifiers. Attempts to supply binding fields, including matching values, are rejected before effects.
- Concurrent and queued inputs retain their exact sources, drafts, and destinations. Stale, cross-agent, retired, ambiguous, or uncertain ownership cannot redirect an effect or cause a duplicate.
- Authorized work proceeds with realistically incomplete optional bookkeeping, including child startup before coordinator reconciliation. Do not prepopulate the very records claimed to be unnecessary. Required identity, authorization, destination, and resource checks still hold.
- Verify user-visible outcomes through each affected runtime adapter. Successful hooks or bookkeeping alone do not establish conversation progress or completed external effects. Report structural checks, behavioral tests, and installed-runtime proof separately.
