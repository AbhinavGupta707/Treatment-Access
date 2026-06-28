# Event Mirror Contract

## Purpose

The Command Center must read live state produced by UiPath-owned execution. The
event mirror is the first-class contract between Maestro/API Workflow/Action
Center/RPA tasks and the custom UI.

UiPath tasks write events through the API Workflow lane. The API Workflow lane
is responsible for writing both:

1. Data Service/Data Fabric records from [entities.json](./entities.json).
2. The mock event mirror API used by the Command Center.

## Event Envelope

Every event write uses this envelope:

```json
{
  "eventId": "evt_synthetic_unique_id",
  "caseId": "TAC-000001",
  "maestroCaseId": "optional-runtime-id",
  "eventType": "case.created",
  "eventAction": "created",
  "primaryStage": "intake",
  "secondaryStageFlag": "",
  "actorType": "maestro|api_workflow|agent|action_center|rpa|system",
  "actorName": "Register Case State",
  "taskOrAgentName": "Register Case State",
  "inputSummary": "Synthetic order TAC-ORDER-001 accepted",
  "outputSummary": "Case shell created",
  "evidenceRefsJson": "[]",
  "traceId": "",
  "orchestratorJobId": "",
  "sourceRecordType": "TaccCaseState",
  "sourceRecordId": "TAC-000001",
  "payloadJson": "{}",
  "syntheticDataDisclaimer": "Synthetic demo data only. Not PHI. Not medical or legal advice.",
  "eventTimestamp": "2026-06-29T00:00:00.000Z"
}
```

## UiPath Task To Event Mapping

| UiPath task                      | Event type                    | Data Service write                                                                 | Command Center impact                              |
| -------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Register Case State              | `case.created`                | Upsert `TaccCaseState`                                                             | Case appears in list                               |
| Pull Synthetic EHR Snapshot      | `ehr.snapshot.pulled`         | Update `TaccCaseState.patientOrderSnapshotJson` through case snapshot payload      | Intake detail shows hydrated synthetic order       |
| Coverage Requirement Agent       | `policy.criteria.extracted`   | Write policy criteria payload into audit event                                     | Policy criteria count and citations visible        |
| Evidence Retrieval Agent         | `evidence.mapping.updated`    | Upsert `TaccEvidenceMapping` rows                                                  | Evidence matrix updates                            |
| Detect Missing Evidence          | `evidence.missing.detected`   | Update `TaccCaseState.activeSecondaryStageFlagsJson` and `evidenceStatusSummary`   | Missing evidence flag and blocked submission state |
| Create Clinician Evidence Task   | `human_task.created`          | Insert `TaccHumanReviewTask`                                                       | Pending clinical validation appears                |
| Persist Clinical Review Decision | `human_task.completed`        | Update `TaccHumanReviewTask` and `TaccEvidenceMapping` reviewer fields             | Evidence row shows approve/edit/reject             |
| Submission Packet Agent          | `submission.packet.generated` | Append `TaccAuditEvent` with packet summary                                        | Packet readiness appears                           |
| Submit Payer API                 | `payer.submission.attempted`  | Insert `TaccPayerSubmission`                                                       | Submission lane shows API attempt                  |
| Submit Payer API failure handler | `payer.api.failed`            | Update `TaccCaseState.activeSecondaryStageFlagsJson`; update `TaccPayerSubmission` | Portal fallback flag appears                       |
| Mock Payer Portal Fallback RPA   | `payer.portal.submitted`      | Update `TaccPayerSubmission.orchestratorJobId` and `portalConfirmationId`          | Robot job and confirmation visible                 |
| Fetch Payer Decision             | `payer.decision.received`     | Update `TaccCaseState.payerStatus`; append decision payload                        | Decision stage changes to approved, denied, or RFI |
| Denial Rescue Agent              | `denial.analysis.completed`   | Append denial analysis audit event                                                 | Denial reason and appeal strategy visible          |
| Appeal Packet Agent              | `appeal.packet.drafted`       | Upsert `TaccAppealPacket`                                                          | Appeal draft visible as pending clinician review   |
| Clinician Appeal Signoff         | `appeal.signoff.completed`    | Update `TaccAppealPacket.clinicianApproved` and edits                              | Appeal can be submitted                            |
| Submit Appeal API                | `appeal.submitted`            | Insert or update `TaccPayerSubmission` with `submissionKind=appeal`                | Appeal status advances                             |
| Care Continuity Agent            | `care.handoff.recommended`    | Append recommendation audit event                                                  | Handoff recommendation visible                     |
| Send Pharmacy Handoff            | `pharmacy.handoff.completed`  | Upsert `TaccPharmacyHandoff`; update `TaccCaseState.pharmacyHandoffStatus`         | Care continuity stage completes                    |
| Generate Audit Packet            | `audit.packet.generated`      | Append final audit event                                                           | Audit summary available                            |
| Write Event Mirror - Case Closed | `case.closed`                 | Update `TaccCaseState.caseStatus`, `outcome`, `currentStage`                       | Case moves to closed                               |
| SLA At Risk rule                 | `sla.at_risk`                 | Update `TaccCaseState.slaState`; append event                                      | SLA badge turns at risk                            |
| SLA Breached rule                | `sla.breached`                | Update `TaccCaseState.slaState`; append event                                      | SLA badge turns breached                           |
| Human Exception Review task      | `exception.review.completed`  | Update `TaccHumanReviewTask` and active flags                                      | Target stage resumes                               |

## Command Center Read Contract

The Command Center should prefer these read models:

| Endpoint                             | Source                                       | Required sort/filter                                                      |
| ------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /cases`                         | `TaccCaseState`                              | Sort by `lastEventTimestamp` desc                                         |
| `GET /cases/:caseId`                 | `TaccCaseState` plus latest related records  | Filter by `caseId`                                                        |
| `GET /cases/:caseId/events`          | `TaccAuditEvent`                             | Filter by `caseId`, sort by `eventTimestamp` asc                          |
| `GET /cases/:caseId/evidence-matrix` | `TaccEvidenceMapping`                        | Filter by `caseId`, sort by `criterionId` asc                             |
| `GET /cases/:caseId/agent-traces`    | `TaccAuditEvent` rows with `actorType=agent` | Filter by `caseId`, redact raw clinical text beyond short evidence quotes |

## Guardrails

- Do not write real patient, payer, provider, credential, or personal health
  data.
- Every clinical assertion event must reference evidence, a policy citation, or
  human approval.
- Appeal text events must be marked as administrative drafts for clinician
  review.
- UiPath is the writer of live state. Command Center may visualize and cache,
  but it must not author authoritative case state directly.
