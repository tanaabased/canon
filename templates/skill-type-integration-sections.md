## Prerequisites

- Confirm required tools, services, auth, and local setup before acting.
- State missing dependencies or access early.

## Inputs

- Identify the required commands, requests, files, ids, or credentials up front.
- Make request/response or command I/O explicit when the interface matters.

## Outputs

- Define the expected changed state, returned data, or produced artifacts.
- Note any user-visible side effects or follow-up handoffs.

## Failure Handling

- Call out partial failure modes, retry limits, and rollback boundaries.
- Do not hide missing auth, missing tools, or remote errors.
