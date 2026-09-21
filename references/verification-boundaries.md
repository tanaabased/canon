# Verification Boundaries

A successful command is sufficient evidence for the operation its contract promises. Additional verification needs a concrete, consequential failure mode that success does not cover; generic reassurance is not enough.

- Before adding a check, identify the uncovered property, the consequence of getting it wrong, and why existing checks or command outputs cannot establish it. Keep this judgment internal unless the tradeoff needs discussion; do not produce a justification checklist.
- Keep checks that establish distinct contracts: source tests, artifact compatibility, and publication are different operations. A successful build does not prove installed behavior, and a successful dry run does not prove publication. Reuse existing evidence until relevant inputs change.
- Let the owning command or composite action handle completion checks, retries, and propagation waits. Do not append duplicate registry lookups, tag polling, fixed sleeps, or custom verification scripts to successful publishers. If a shared action lacks a necessary guarantee, fix its contract rather than recreating it in each consumer.
- Distinguish completed work from accepted or queued work. When completion is required, use the command's supported wait or the operation's terminal status; acceptance alone is sufficient only for a submission request.
- Add a separate post-success check only for an explicit user request, an uncovered acceptance criterion, a known defect, or a consequential boundary such as silently dropped fields or partial multi-step mutations. Retain those readbacks inside their owning integration; callers should not repeat them after verified success.
- When external visibility itself must be checked, allow for documented propagation delays, use bounded polling, and report unresolved visibility separately from publication failure. Never republish merely because a cached lookup has not caught up.
- Report what the evidence establishes. Successful publication need not establish downstream installation or runtime activation unless that is part of the requested outcome.
