# Treatment Access Agent Contracts

These contracts are the local source of truth for Checkpoint 3 agent artifacts.
They are implemented as Zod schemas in `packages/shared-schemas/src/index.ts`
and exercised by the deterministic runtime in `packages/agent-runtime`.

No live UiPath Agent Builder debug or side-effecting Orchestrator run is implied
by this file. Downstream UiPath lanes should map Agent Builder prompts/tools to
these IDs and output fields, then compare local debug output with:

```bash
CI=true pnpm smoke:agents
```

## Agent IDs

| Agent ID | Display name | Required runtime behavior |
| --- | --- | --- |
| `coverage-requirement` | Coverage Requirement Agent | Resolve policy criteria, citations, required documents, and submission channels. |
| `evidence-retrieval` | Evidence Retrieval Agent | Map synthetic artifacts to criteria and route clinical assertions to evidence, policy citation, or human approval. |
| `missing-evidence` | Missing Evidence Agent | Detect blocking missing evidence and create human task payloads. |
| `submission-packet` | Submission Packet Agent | Build a payer packet only when safety and clinician-review gates allow it. |
| `denial-rescue` | Denial Rescue Agent | Parse denial category and select a strategy that changes for step therapy, safety screen, or medical necessity. |
| `appeal-packet` | Appeal Packet Agent | Draft administrative appeal language for clinician review with unsupported-claim warnings. |
| `care-continuity` | Care Continuity Agent | Plan pharmacy handoff only after payer or appeal approval. |

## Shared Envelope

Every local agent result must include:

- `agent_id`: one of the seven IDs above.
- `trace`: `AgentTraceSchema`, including `trace_id`, `agent_name`, `status`,
  `tool_calls`, and `evidence_refs`.
- `audit_event`: `AuditEventSchema`, suitable for mock `/events` ingestion or a
  UiPath-written event mirror.
- `output`: the agent-specific discriminated output.

## Safety Gates

- Missing synthetic TB/hepatitis safety labs produce `MISSING_SAFETY_LAB` and
  block submission.
- Medical necessity or diagnosis/severity assertions must carry evidence refs,
  policy citations, or human approval routing.
- Appeal text is always an administrative draft for clinician review and is not
  autonomous medical or legal advice.
- Unsupported clinical assertions produce warnings and cannot be hidden inside
  payer-facing language.
