# Submission Packet Agent

Low-code autonomous UiPath Agent Builder project for assembling a payer-ready prior authorization packet from UiPath-owned case state.

## Responsibility

- Assemble administrative packet fields from `caseSnapshot`, `patientSnapshot`, `order`, `payerPolicy`, `criteria`, `evidenceMappings`, `attachments`, and `humanApprovals`.
- Refuse submission by structured output when blocking evidence is missing, conflicting, or awaiting clinician validation.
- Emit traceable refs for evidence mappings, artifacts, attachments, citations, and human approval records.
- Keep the custom app as a viewer only; live packet state should be written by UiPath workflow or agent event records.

## Contract

Input fields are declared in `agent.json` and mirrored in `entry-points.json`:

- `caseSnapshot`: TreatmentAccessCase-shaped object.
- `patientSnapshot`: PatientSnapshot-shaped synthetic object.
- `order`: TreatmentOrder-shaped synthetic object.
- `payerPolicy`: PayerPolicy-shaped object from Coverage Requirement Agent.
- `criteria`: PolicyCriterion array.
- `evidenceMappings`: EvidenceMapping array from evidence/missing-evidence agents.
- `attachments`: AttachmentMetadata array.
- `humanApprovals`: completed human decisions for clinician-attested assertions.
- `builtAtIso`: UiPath-supplied ISO timestamp.

Output fields:

- `packet_id`, `case_id`, `ready_to_submit`, `submission_gate`, `block_reasons`.
- `form_fields`, `attachment_ids`, `cover_letter_summary`.
- `evidence_refs`, `unsupported_claim_warnings`, `required_human_approval_refs`.
- `built_at`, `version`, `audit_summary`.

## Gate Behavior

- `ready`: all blocking criteria have evidence and required clinician validations are approved.
- `blocked_missing_evidence`: any blocking criterion has missing evidence, null `artifact_id`, or confidence `0`.
- `blocked_clinician_validation`: a clinician-attested criterion lacks a completed approval.
- `blocked_conflicting_evidence`: a blocking mapping is conflicting.

The agent does not submit to the payer. A downstream UiPath workflow should call `payer-prior-auth-submit.workflow.json` only when `ready_to_submit=true`.

## Tool Mapping

This packet is intentionally tool-free until the integration lane registers process resources in a solution. Maestro/API Workflow orchestration should provide inputs from:

- `ehr-order-evidence-pull.workflow.json`
- human evidence approval task outputs
- `write-event.workflow.json` for the returned `audit_summary`
- `payer-prior-auth-submit.workflow.json` after the gate passes

## Local Static Checks

```bash
uip agent migrate uipath/agents/submission-packet --output json
uip agent validate uipath/agents/submission-packet --output json
```

Live `uip agent run`, `uip agent push`, publish, deploy, and payer submission are intentionally not run without approval.
