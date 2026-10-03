# Mock-AI Fixtures

Apply this policy only to recorded external responses and approval-style expected outputs used by mock-AI tests in Codex or OpenClaw projects. Do not adopt this workflow for ordinary unit fixtures, general CLI testing, or unrelated projects by default. Prefer simple deterministic inputs when recordings add no fidelity the test needs.

- Replace only the external boundary the scenario intends to mock. Keep production command construction, arguments, parsing, and the product flow under test intact; a recording must not bypass the behavior being proved.
- Keep replay deterministic and offline. Missing fixtures, unexpected requests, or mismatched arguments must fail clearly rather than fall back to a live service or silently accept new output.
- Separate replay, live checking, and recording. Replay consumes reviewed fixtures; an explicitly requested live check compares current behavior without changing them; recording writes candidate fixtures for review without overwriting approved expectations.
- Keep live checking and recording local and explicitly invoked unless the user authorizes a separate CI workflow. CI may replay reviewed fixtures, but must not refresh or approve them automatically.
- Sanitize credentials, private content, and machine-specific values before saving candidates. Preserve protocol structure, exit status, meaningful errors, and relationships between identifiers; normalization must not erase a behavioral difference the test should catch.
- Review candidate diffs against the intended contract before promoting them to approved expectations. A changed recording is evidence to investigate, not a reason to update the expected output until the test passes. Prefer semantic assertions over incidental prose or formatting.
- Keep fixtures flat under the nearest owning test or scenario, following existing ownership rules. Record only the command or request shape, relevant producer version, and brief rationale needed to understand or refresh them; do not accumulate raw transcripts or a second fixture catalog.
- Treat passing replay as evidence of behavior against those recorded responses, not of current provider behavior or model judgment. Keep real host integration in the owning Leia scenario, which may use mocked responses; require a separately scoped live call only when recordings cannot prove the required behavior.
