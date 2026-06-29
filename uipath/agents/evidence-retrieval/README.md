# Evidence Retrieval Agent

Low-code autonomous UiPath Agent Builder packet for mapping synthetic chart evidence to policy criteria.

## Project

- Solution shell: `evidence-retrieval.uipx`
- Agent project: `EvidenceRetrievalAgent`
- UiPath folder target: `TreatmentAccessHackathon`

## Contract

Input fields: `case_context`, `criteria`, `artifacts`, `labs`, `medication_history`, `treatment_order`, `demo_toggles`.

Output fields: `evidence_mappings`, `evidence_artifacts_used`, `blocking_missing_criteria`, `human_review_recommended`, `source_grounding_warnings`, `audit_event_draft`, `agent_trace_draft`.

## Tools To Bind Later

- `mock_ehr_order_evidence_pull`: API Workflow output for synthetic chart/order/evidence pull.
- `document_extractor_or_ixp`: Document Understanding/IXP or fallback parser for attachments.
- `deterministic_evidence_search`: criterion-to-artifact matcher with source-span preservation.
- `schema_validator`: shared runtime schema check before writing event records.

The missing safety lab toggle is represented in `samples/missing-safety-lab.output.json`: `criterion-safety-screen` becomes `missing`, confidence `0`, and appears in `blocking_missing_criteria`.

## Validation

`uip agent validate uipath/agents/evidence-retrieval/EvidenceRetrievalAgent --output json`
