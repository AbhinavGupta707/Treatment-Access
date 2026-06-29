# Appeal Packet Agent

Low-code autonomous UiPath Agent Builder project for drafting a source-grounded administrative appeal packet after Denial Rescue Agent strategy selection.

## Responsibility

- Draft appeal text only as an administrative draft for clinician review.
- Preserve source citations and evidence refs from denial rescue, evidence mapping, and policy outputs.
- Emit unsupported-claim warnings instead of inventing facts.
- Gate appeal submission behind Action Center contract `appeal_signoff`.

## Contract

Input fields:

- `caseSnapshot`: TreatmentAccessCase-shaped object.
- `payerDecision`: PayerDecision-shaped denial record.
- `denialRescue`: Denial Rescue Agent output.
- `submissionPacket`: SubmissionPacket-shaped original packet.
- `evidenceMappings`: EvidenceMapping array.
- `citations`: Citation array.
- `clinicianReview`: current signoff state.
- `generatedAtIso`: UiPath-supplied ISO timestamp.

Output fields:

- `appeal_id`, `case_id`, `denial_reason`, `appeal_strategy`.
- `draft_text`, `draft_summary`, `evidence_used`, `citations`.
- `unsupported_claim_warnings`.
- `clinician_review_required`, `clinician_approved`, `clinician_gate_status`.
- `action_center_task_key`, `administrative_label`, `generated_at`, `version`, `audit_summary`.

## Clinician Gate

All pending drafts return:

- `clinician_review_required=true`
- `clinician_approved=false`
- `clinician_gate_status=requires_signoff`
- `action_center_task_key=appeal_signoff`

The Action Center contract lives at `uipath/action-center/contracts/appeal-signoff.quickform.json`. Appeal submission must wait for an approved or approved-with-edits outcome with `clinician_approved=true`.

## Tool Mapping

This packet is tool-free until the integration lane registers process resources. Maestro should create the `appeal_signoff` Action Center task after this agent returns a draft, then use the completed task payload to decide whether an appeal submission workflow may run.

## Local Static Checks

```bash
uip agent migrate uipath/agents/appeal-packet --output json
uip agent validate uipath/agents/appeal-packet --output json
```

Live `uip agent run`, `uip agent push`, publish, deploy, Action Center task creation, and appeal submission are intentionally not run without approval.
