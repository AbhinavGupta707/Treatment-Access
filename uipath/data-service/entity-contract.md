# Data Service Entity Contract

## Scope

This is a local contract for Data Service/Data Fabric entities in the UiPath
folder `TreatmentAccessHackathon` (`4fba2fa1-012b-469a-b6aa-e5be3811c173`).
No live entities are created by this lane.

All rows must include:

- `caseId` where the record belongs to a treatment access case.
- `syntheticDataDisclaimer` with the fixed text:
  `Synthetic demo data only. Not PHI. Not medical or legal advice.`
- Timestamps from UiPath workflow, agent, robot, or human task execution.

## Entities

| Entity                | Purpose                                    | Primary writer                                        | Primary readers                             |
| --------------------- | ------------------------------------------ | ----------------------------------------------------- | ------------------------------------------- |
| `TaccCaseState`       | Current case snapshot                      | Maestro/API Workflow event mirror                     | Command Center, UiPath Apps                 |
| `TaccEvidenceMapping` | Policy criterion to chart evidence mapping | Evidence Retrieval Agent, clinician review write-back | Command Center, Action Center, appeal agent |
| `TaccAuditEvent`      | Append-only runtime timeline               | Every UiPath task through event mirror workflow       | Command Center timeline, audit packet       |
| `TaccHumanReviewTask` | Action Center task mirror                  | Action Center lane                                    | Command Center, Maestro stage conditions    |
| `TaccPayerSubmission` | API/portal/appeal submission attempt       | API Workflow and RPA lanes                            | Command Center, payer decision stage        |
| `TaccAppealPacket`    | Denial rescue appeal packet                | Denial Rescue/Appeal agents plus clinician signoff    | Command Center, submission workflow         |
| `TaccPharmacyHandoff` | Pharmacy/scheduling handoff                | Care Continuity API Workflow                          | Command Center, closure stage               |

See [entities.json](./entities.json) for field-level Data Fabric types and
constraints.

## Stage And Flag Fields

`TaccCaseState.currentStage` must use one of:

```text
intake
policy_evidence
clinical_validation
submission
payer_decision
denial_rescue
care_continuity
closure
```

`TaccCaseState.activeSecondaryStageFlagsJson` is a serialized JSON array using:

```text
missing_evidence
api_failure_portal_fallback
denial_rescue_appeal
clinician_rework
sla_risk
human_exception_review
```

## Field Ownership

| Field family            | Writer                                                    | Notes                                                                       |
| ----------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| Case identity           | Maestro Case                                              | `caseId` is `metadata.ExternalId`; do not derive it from mock APIs          |
| Patient/order/payer IDs | Intake/App lane                                           | Synthetic IDs only                                                          |
| Evidence mapping        | Evidence Retrieval Agent and clinician review task        | Every clinical assertion needs evidence, policy citation, or human approval |
| Human review state      | Action Center lane                                        | Writes task creation, completion, decision, reviewer edits                  |
| Payer submission state  | API Workflow/RPA lanes                                    | API failures activate portal fallback secondary flag                        |
| Appeal packet           | Denial Rescue and Appeal Packet agents, clinician signoff | Draft language is administrative and requires clinician review              |
| Pharmacy handoff        | Care Continuity API Workflow                              | Case cannot close until handoff is completed                                |
| Audit events            | Event mirror API Workflow                                 | Append-only; Command Center timeline reads this first                       |
| SLA state               | Maestro Case                                              | At-risk and breached events are mirrored through audit events               |

## Data Fabric Creation Notes

When live creation is approved:

1. Use `.agents/skills/uipath-platform/SKILL.md` and its Data Fabric reference.
2. List existing entities before creating anything.
3. Use folder scope `TreatmentAccessHackathon`.
4. Review the schema proposal with the orchestrator before invoking
   `uip df entities create`.
5. Keep the JSON-shaped fields as `STRING` until a live entity evolution plan
   explicitly introduces choice sets or relationships.
