# Recorded Responses and Mock-AI Fixtures

Use this policy when correctness depends on an external CLI, SDK, RPC, or native-tool response shape, or when mock-AI tests in Codex or OpenClaw projects use recorded responses or approval-style expectations. Prioritize recordings after a relevant version or interface change or a regression caused by an incorrect fake. Prefer simple deterministic inputs when recordings add no fidelity the test needs; don't require captures for every dependency or ordinary synthetic unit fixture.

## Evidence and Scope

- **Observed captures** come from an identified producer and retain the contract-relevant response after sanitization.
- **Derived cases** deliberately alter or synthesize inputs for edge conditions, such as a missing field or invalid type. Label the change and its purpose; don't present it as observed producer behavior.
- **Unsupported assumptions** have neither captured evidence nor an established contract. Keep them unverified rather than making a plausible fake their evidence.

Replace only the external boundary being mocked. Exercise the local production parser, mapper, or request builder where that contract matters, keeping production command construction, arguments, and the product flow under test intact. Loading a recording after bypassing that code proves little about its handling of the real response.

Keep replay deterministic and offline. Missing fixtures, unexpected requests, or mismatched arguments must fail clearly rather than fall back to a live provider or silently accept new output. Prefer semantic assertions over incidental prose or formatting, retaining exact formatting when it is the contract.

## Record, Review, and Refresh

1. **Record:** Explicitly capture a selected response into a candidate, separately from approved expectations. Retain the source command or method and request shape, relevant tool version, capture time and sanitized source provenance, and brief rationale. Use controlled resources and follow the consuming repository's isolation and authorization rules for every live operation.
2. **Sanitize:** Remove credentials, personal or private content, and machine-specific values before saving candidates or provenance. Preserve contract-relevant field types, optional-field presence or absence, nesting, pagination, output streams, formatting, exit status, meaningful errors, and relationships between identifiers. Normalization must not erase the behavioral difference being tested. Reject incomplete or failed captures unless that failure is the deliberately selected observed case.
3. **Review:** Inspect the candidate, provenance, and diff independently of the fake's implementation and test expectations. Compare them with the producer's response and intended contract; a passing replay alone cannot establish fidelity. Investigate changed output before deciding whether the capture, production code, or expectation needs correction.
4. **Accept:** Intentionally promote the reviewed candidate and its provenance to approved fixtures. Recording must not overwrite approved expectations, and acceptance must not happen merely to make a failing test pass.
5. **Check:** An explicitly requested live comparison captures current behavior and reports differences without replacing approved fixtures. Refresh intentional drift through record, sanitize, review, and accept again.

Ordinary CI tests may replay committed, reviewed fixtures, but must not refresh or approve them automatically. Keep live recording and comparison explicitly invoked and local unless the user authorizes a separate CI workflow; don't add automatic recording or live comparison to CI by default. Reuse existing repository tools instead of requiring a new recording framework.

Keep fixtures flat under the nearest owning test or scenario, following existing ownership rules. Retain only the sanitized evidence and provenance needed to understand or refresh them; don't accumulate raw transcripts or a second fixture catalog. [Agent System's recorded CLI workflow](https://github.com/tanaabased/openclaw-agent-system/blob/main/DEVELOPMENT.md#recorded-cli-fixtures) demonstrates separate candidate capture, provenance inspection, acceptance, and live comparison while preserving JSON text and paginated nesting. Its repository-specific commands and setup aren't a universal requirement.

## Example and Evidence Limits

For a paginated review CLI, an observed fixture could retain sanitized JSON text with two page arrays, a string `state`, and a nested `user.login`, alongside the source argv and CLI version. Replay those pages through the production review parser. A copy that removes `user` to test rejection is a derived negative case; label the intentional deletion rather than claiming the CLI emitted it. This is an illustrative pair, not an actual capture.

Classify each assertion using the [shared testing layers](./coding-stack-preferences.md#testing-defaults) and [verification boundaries](./verification-boundaries.md#evidence-and-static-checks). Reading a fixture while executing the production parser is behavioral coverage. Keep strict units deterministic, use bounded components for real subsystem wiring with fake external services, and reserve assembled installed-plugin flows for the [owning Leia scenario](./leia-markdown-scenarios.md#scope-and-placement).

Passing replay establishes local handling of recorded contracts. It does not establish current provider compatibility, live model quality or judgment, or installed runtime behavior. A recording does not replace integration proof: keep real host integration in its focused Leia scenario, which may use mocked responses, and require a separately scoped live call only when existing evidence cannot prove the required behavior.
