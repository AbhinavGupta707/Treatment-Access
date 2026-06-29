# Care Continuity Agent

Low-code autonomous Agent Builder packet for the Approval & Care Continuity stage.

## Purpose

The agent starts only after a payer approval or appeal approval exists. It prepares the pharmacy/scheduling handoff, returns the exact API Workflow invocation payload, emits audit/event records, and blocks closure when the handoff fails or has not executed yet.

The handoff-producing workflow remains UiPath-owned:

```text
uipath/api-workflows/pharmacy-scheduling-handoff.workflow.json
```

## Inputs

- `apiBaseUrl`, `caseId`, `patientId`, `orderId`, `approvalReference`
- `approvalDecision`: payer approval or appeal approval payload
- `treatmentOrder`, `patientSnapshot`, `pharmacyRequirements`
- `demoToggles`: especially `pharmacy_handoff_failure`
- `caseTimeline`: prior UiPath event and trace summaries

## Outputs

- `handoff_status`: `blocked`, `ready_to_invoke`, `completed`, or `failed`
- `workflowInvocation`: side-effecting API Workflow call that Maestro must execute
- `pharmacyHandoff`: `PharmacyHandoff`-compatible object
- `schedulingTask`: scheduling reference or pending/failure state
- `eventPayloads`: `AuditEvent`-compatible event mirror writes
- `closureReadiness`: closure blockers and required audit events

## Failure Behavior

When approval is absent, the agent returns `handoff_status: blocked`. When the pharmacy workflow fails or the demo toggle requests failure, the agent returns `handoff_status: failed`, sets `pharmacyHandoff.status: failed`, activates `human_exception_review`, and emits `pharmacy_handoff_failed`.

## Local Validation

After editing:

```bash
uip agent refresh uipath/agents/care-continuity --output json
uip agent validate uipath/agents/care-continuity --output json
```

Live debug/upload/deploy is intentionally excluded from this packet and requires explicit approval.
