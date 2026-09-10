# Commit Subjects

This reference owns the subject convention for human- and agent-authored, issue-backed commits. Authoring guidance should link here instead of restating the rules.

## Canonical Subject

Use `#<issue-number>: <lowercase description>`.

- Use the backing GitHub issue's number, not the pull request's number.
- Begin the description with a lowercase verb and use lowercase for ordinary prose. Render proper names and terms with established capitalization in ALL CAPS: `OpenClaw` becomes `OPENCLAW`, `GitHub` becomes `GITHUB`, and `EMORI` stays `EMORI`. Do not retain mixed-case styling in the description.
- Do not substitute Conventional Commit prefixes such as `fix:` or `docs:` for this form, or insert them before the description. Use verbs such as `fix` and `document` without a colon.

## Prefix Ownership

Supply the complete canonical subject by default, including for a manually delivered first commit.

Only when Agent System explicitly owns the trusted issue-number prefix for the **first lifecycle commit**, supply the lowercase description alone. Agent System's presence is not evidence of that ownership. The delivered commit must still have the complete canonical subject, with the trusted prefix applied exactly once.

For every later commit, including Agent System PR follow-ups and manually delivered commits, supply the complete canonical subject. Do not carry the first-commit exception into subsequent delivery.

## Exempt Formats

Generated release commits, dependency automation, merge commits, and other explicitly machine-owned formats retain the format owned by their generating workflow. An ordinary human- or agent-authored issue-backed change does not become exempt merely because it concerns a release or dependencies.

GitHub merge and squash settings select message sources; they do not define authored commit-subject syntax. This convention does not change those settings or rewrite generated history.

## Examples

These cases use issue `42` and, where applicable, PR `73`. `Agent System` in the prefix-owner column means explicit trusted ownership for that first lifecycle commit; `author` means the author supplies the whole subject.

| Delivery                                                    | Issue | PR   | Prefix owner | Supplied subject                        | Delivered subject                       |
| ----------------------------------------------------------- | ----- | ---- | ------------ | --------------------------------------- | --------------------------------------- |
| Agent System first lifecycle commit                         | 42    | 73   | Agent System | `add OPENCLAW delivery support`         | `#42: add OPENCLAW delivery support`    |
| Agent System first commit without explicit prefix ownership | 42    | 73   | author       | `#42: add OPENCLAW delivery support`    | `#42: add OPENCLAW delivery support`    |
| Agent System PR follow-up                                   | 42    | 73   | author       | `#42: preserve EMORI identity on retry` | `#42: preserve EMORI identity on retry` |
| Manual first commit                                         | 42    | none | author       | `#42: document OPENCLAW setup`          | `#42: document OPENCLAW setup`          |
| Manual PR follow-up                                         | 42    | 73   | author       | `#42: fix EMORI retry handling`         | `#42: fix EMORI retry handling`         |

Reject `fix: preserve EMORI identity`, `#42: docs: update OPENCLAW setup`, `#42: Add OPENCLAW support`, and `#42: add OpenClaw support`. A description alone is also invalid for a follow-up commit, and `#73: fix EMORI retry handling` uses the PR number instead of the backing issue.

## Validation

Before delivery, verify the backing issue, lifecycle stage, and explicit prefix owner; check the supplied subject against the applicable example. After delivery, inspect the actual commit subject, for example with `git log -1 --format=%s`, and verify the complete form, correct issue number, a single prefix, and description casing.

The existing unit suite checks this reference's lifecycle examples and authoring links. Those checks validate Canon's guidance, not Agent System's runtime prefixing implementation. Any runtime implementation must separately prove that first-commit prefixing happens exactly once and that subsequent PR follow-ups preserve the complete supplied subject.
