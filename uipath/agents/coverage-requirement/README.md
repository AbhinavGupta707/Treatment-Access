# Coverage Requirement Agent

Low-code autonomous UiPath Agent Builder packet for extracting synthetic payer policy requirements.

## Project

- Solution shell: `coverage-requirement.uipx`
- Agent project: `CoverageRequirementAgent`
- UiPath folder target: `TreatmentAccessHackathon`

## Contract

Input fields: `case_context`, `patient_snapshot`, `treatment_order`, `payer_policy_document`, `policy_artifacts`, `demo_toggles`.

Output fields: `authorization_required`, `submission_channels`, `criteria`, `required_documents`, `policy_citations`, `payer_policy`, `human_approval_required`, `source_grounding_warnings`, `audit_event_draft`, `agent_trace_draft`.

## Tools To Bind Later

- `policy_lookup_api`: synthetic policy lookup by payer, policy id, or fixture URI.
- `extraction_fallback_parser`: fallback extraction with source-span preservation.
- `schema_validator`: shared runtime schema check before writing event records.

No live tool resources are bound in this packet; the validated agent consumes supplied structured input and is ready for the runtime lane to connect tools or inline-flow data.

## Samples

- `samples/happy-path.input.json`
- `samples/happy-path.output.json`

## Validation

`uip agent validate uipath/agents/coverage-requirement/CoverageRequirementAgent --output json`
