# Denial Rescue Agent

Low-code autonomous UiPath Agent Builder project for parsing payer denial responses and selecting a denial-specific rescue strategy.

## Responsibility

- Normalize payer denial status and reason from `payerDecision` plus synthetic letter text.
- Select exactly one strategy from `step_therapy`, `safety_screen`, `documentation_gap`, `not_denied`, or `unknown`.
- Return evidence refs, weak or missing refs, unsupported-claim warnings, and the next agent route.
- Avoid appeal drafting; the Appeal Packet Agent owns administrative draft language.

## Contract

Input fields:

- `caseSnapshot`: TreatmentAccessCase-shaped object.
- `payerDecision`: PayerDecision-shaped object.
- `denialLetterText`: synthetic raw denial or payer response text.
- `submissionPacket`: SubmissionPacket-shaped object.
- `evidenceMappings`: EvidenceMapping array.
- `policyCriteria`: PolicyCriterion array.
- `strategyCatalogVersion`: static strategy catalog identifier.

Output fields:

- `case_id`, `decision_status`, `normalized_denial_reason`, `denial_code`.
- `parsed_denial_summary`, `appeal_deadline`, `rescue_strategy`.
- `evidence_refs`, `missing_or_weak_refs`, `unsupported_claim_warnings`.
- `next_agent`, `audit_summary`.

## Strategy Behavior

- `step_therapy`: triggered by prior therapy, preferred therapy, trial/failure/intolerance, or step-edit language. Uses medication-history mappings and routes to Appeal Packet Agent when evidence exists.
- `safety_screen`: triggered by TB, hepatitis, infection-risk, safety-screening, or missing lab language. Routes to Missing Evidence Agent if required safety artifacts are absent.
- `documentation_gap`: triggered by insufficient records, diagnosis/severity documentation, medical necessity not established, chart note gaps, or RFI language. Requires clinician review for source-grounded administrative appeal language.
- `not_denied`: for approved, submitted, under-review, or appeal-approved statuses.
- `unknown`: when a denial exists but cannot be mapped; route to Human Exception Review.

## Tool Mapping

This packet is tool-free until process resources are registered. Orchestration should provide payer state from `payer-status-fetch.workflow.json`, denial artifacts from extraction/fallback parsing, and write returned summaries with `write-event.workflow.json`.

## Local Static Checks

```bash
uip agent migrate uipath/agents/denial-rescue --output json
uip agent validate uipath/agents/denial-rescue --output json
```

Live `uip agent run`, `uip agent push`, publish, deploy, and Action Center creation are intentionally not run without approval.
