# Architecture Review: <scope>

Use this outline in chat by default; it does not authorize creating a file. For requested Markdown output, use the specified or agreed destination. Scale detail to the reviewed scope, omit unnecessary sections, and replace placeholders with findings rather than copying these notes into the result.

## Scope and Evidence

Target and user journeys; reviewed revision and relevant dirty/in-flight changes; the shared [inspection inventory](../../../references/skill-standard.md#inspection-inventory) before findings. Note known issues, planned removals, and previous findings when available.

## Implemented Architecture

Explain responsibilities, entry points, state ownership, integrations, and important success/failure flows. Use a compact responsibility-to-file/symbol map and readable Mermaid diagrams when helpful. Support significant diagram relationships with source references; mark inference.

## Findings and Retained Decisions

For each consequential finding: evidence and source locations, consequence, confidence/uncertainty, smallest recommendation, and verification. Distinguish defects, maintenance costs, and preferences. State what stays and why; label out-of-scope observations separately. On repeat reviews, reconcile earlier findings as resolved, still present, changed, or unverified.

## Proposed Changes and Roadmap

Explain tradeoffs and alternatives, including defer/no change. Add proposed diagrams or current-to-proposed module/directory mappings only when useful. Sequence steps by benefit, effort, regression risk, and dependencies; identify changes that must land together, verification for each step, and existing issues/plans that already own the work.

## Limitations

State what inspection or executed checks establish and what remains unverified. Separate static evidence from runtime, CI, and installation proof.
