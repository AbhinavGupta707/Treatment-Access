# Audit Packet Agent

Low-code autonomous Agent Builder packet for Closure & Audit.

## Purpose

The agent compiles a final audit-ready packet manifest after care continuity succeeds, or an audit draft with blockers when handoff or human decisions remain open. It gathers policy criteria, evidence, agent outputs, human decisions, payer events, appeal packet refs, approval refs, handoff refs, and disclaimers.

## Inputs

- Case snapshot and prior audit events
- Criteria and evidence mappings
- Agent trace summaries for all seven agents
- Human tasks and clinician decisions
- Submission attempts, payer decisions, appeal packet
- Pharmacy handoff and scheduling refs
- Attachment metadata

## Outputs

- `packet_status`: `audit_ready`, `audit_draft_blocked`, or `needs_human_review`
- `auditPacketManifest`: sectioned manifest with record refs and disclaimers
- `completenessChecks`: deterministic validator results
- `unsupportedClaimFindings`: source/human approval gaps
- `humanDecisionLedger`: human task provenance
- `eventPayload`: `AuditEvent`-compatible write for `audit_packet_generated`

## Audit Rules

- Every clinical assertion needs source evidence, policy citation, or completed human approval.
- Appeal language remains administrative draft text unless clinician signoff is complete.
- Handoff failure keeps the packet in `audit_draft_blocked` until exception resolution.
- The packet includes synthetic-data and non-advice disclaimers.

## Local Validation

```bash
uip agent refresh uipath/agents/audit-packet --output json
uip agent validate uipath/agents/audit-packet --output json
```

Live debug/upload/deploy is intentionally excluded from this packet and requires explicit approval.
