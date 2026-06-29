# Missing Evidence Agent

Low-code autonomous UiPath Agent Builder packet for blocking payer submission when evidence is missing, contradictory, low-confidence, or awaiting human approval.

## Project

- Solution shell: `missing-evidence.uipx`
- Agent project: `MissingEvidenceAgent`
- UiPath folder target: `TreatmentAccessHackathon`

## Contract

Input fields: `case_context`, `case_urgency`, `criteria`, `evidence_mappings`, `action_center_contract`, `demo_toggles`.

Output fields: `submission_blocked`, `ready_for_submission`, `missing_evidence_gates`, `human_tasks`, `secondary_stage_activations`, `visible_missing_evidence_output`, `source_grounding_warnings`, `audit_event_draft`, `agent_trace_draft`.

## Tools To Bind Later

- `role_routing_rules`: assigns gate owner roles such as nurse-coordinator or clinician-reviewer.
- `action_center_task_builder`: drafts HumanTask-compatible prompts for orchestration to create later.
- `schema_validator`: shared runtime schema check before writing event records.

The missing safety lab sample blocks submission and emits a visible missing-evidence message for TB/hepatitis screening. This agent only drafts task outputs; UiPath workflows must create live Action Center tasks.

## Validation

`uip agent validate uipath/agents/missing-evidence/MissingEvidenceAgent --output json`
